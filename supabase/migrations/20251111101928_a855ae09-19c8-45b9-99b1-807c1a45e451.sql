-- Enable realtime for inhalation_logs, devices, and notifications tables
ALTER PUBLICATION supabase_realtime ADD TABLE inhalation_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE devices;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;