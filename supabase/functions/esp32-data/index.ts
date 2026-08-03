import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
interface InhalationData {
  inhalation_strength: number;
  duration: number;
  orientation_angle: number;
  result: 'perfect' | 'too_fast' | 'too_slow' | 'too_weak' | 'wrong_angle';
  feedback_message?: string;
}

interface DeviceStatus {
  battery_level: number;
  is_charging: boolean;
  firmware_version?: string;
}

interface ESP32Request {
  esp32_id: string;
  inhalation?: InhalationData;
  device_status?: DeviceStatus;
}

// Validation function
function validateRequest(data: any): { valid: boolean; error?: string } {
  if (!data.esp32_id || typeof data.esp32_id !== 'string') {
    return { valid: false, error: 'Missing or invalid esp32_id' };
  }

  if (data.inhalation) {
    const { inhalation_strength, duration, orientation_angle, result } = data.inhalation;
    
    if (typeof inhalation_strength !== 'number' || inhalation_strength < 0 || inhalation_strength > 100) {
      return { valid: false, error: 'Invalid inhalation_strength (must be 0-100)' };
    }
    
    if (typeof duration !== 'number' || duration < 0 || duration > 60) {
      return { valid: false, error: 'Invalid duration (must be 0-60 seconds)' };
    }
    
    if (typeof orientation_angle !== 'number' || orientation_angle < -180 || orientation_angle > 180) {
      return { valid: false, error: 'Invalid orientation_angle (must be -180 to 180)' };
    }
    
    const validResults = ['perfect', 'too_fast', 'too_slow', 'too_weak', 'wrong_angle'];
    if (!validResults.includes(result)) {
      return { valid: false, error: 'Invalid result value' };
    }
  }

  if (data.device_status) {
    const { battery_level, is_charging } = data.device_status;
    
    if (typeof battery_level !== 'number' || battery_level < 0 || battery_level > 100) {
      return { valid: false, error: 'Invalid battery_level (must be 0-100)' };
    }
    
    if (typeof is_charging !== 'boolean') {
      return { valid: false, error: 'Invalid is_charging (must be boolean)' };
    }
  }

  return { valid: true };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const requestData: ESP32Request = await req.json();
    
    console.log('Received data from ESP32:', requestData.esp32_id);

    // Validate input
    const validation = validateRequest(requestData);
    if (!validation.valid) {
      console.error('Validation error:', validation.error);
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find device by esp32_id
    const { data: device, error: deviceError } = await supabase
      .from('devices')
      .select('id, user_id')
      .eq('esp32_id', requestData.esp32_id)
      .single();

    if (deviceError || !device) {
      console.error('Device not found:', requestData.esp32_id);
      return new Response(
        JSON.stringify({ error: 'Device not registered' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Device found:', device.id, 'User:', device.user_id);

    // Insert inhalation log if provided
    if (requestData.inhalation) {
      const { error: logError } = await supabase
        .from('inhalation_logs')
        .insert({
          user_id: device.user_id,
          device_id: device.id,
          inhalation_strength: requestData.inhalation.inhalation_strength,
          duration: requestData.inhalation.duration,
          orientation_angle: requestData.inhalation.orientation_angle,
          result: requestData.inhalation.result,
          feedback_message: requestData.inhalation.feedback_message || null,
        });

      if (logError) {
        console.error('Error inserting inhalation log:', logError);
        return new Response(
          JSON.stringify({ error: 'Failed to save inhalation data' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Inhalation log inserted successfully');
    }

    // Update device status if provided
    if (requestData.device_status) {
      const updateData: any = {
        battery_level: requestData.device_status.battery_level,
        is_charging: requestData.device_status.is_charging,
        last_sync: new Date().toISOString(),
      };

      if (requestData.device_status.firmware_version) {
        updateData.firmware_version = requestData.device_status.firmware_version;
      }

      const { error: updateError } = await supabase
        .from('devices')
        .update(updateData)
        .eq('id', device.id);

      if (updateError) {
        console.error('Error updating device status:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update device status' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Device status updated successfully');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Data received and stored successfully' 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in esp32-data function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
