export interface ThingSpeakFeed {
  created_at: string;
  entry_id: number;
  field1: string | null; // Nitrogen
  field2: string | null; // Phosphorus
  field3: string | null; // Potassium
}

export interface ThingSpeakChannel {
  id: number;
  name: string;
  description: string;
  latitude: string;
  longitude: string;
  field1: string;
  field2: string;
  field3: string;
  created_at: string;
  updated_at: string;
  last_entry_id: number;
}

export interface ThingSpeakResponse {
  channel: ThingSpeakChannel;
  feeds: ThingSpeakFeed[];
}

export interface DashboardData {
  timestamp: string;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
}
