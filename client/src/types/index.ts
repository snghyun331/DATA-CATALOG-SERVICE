// Database Types
export interface Database {
  name: string;
  tables: number;
  size: string;
  lastUpdate: string;
  status: 'active' | 'maintenance';
}

// Table Types
export interface TableData {
  tableName: string;
  columns: number;
  records: string;
  lastUpdate: string;
  size: string;
}

// Component Props Types
export interface SidebarProps {
  databases: Database[];
  onDBSelect: (db: Database) => void;
}

export interface HeaderProps {
  selectedDB: Database | null;
}

export interface HomeProps {
  databases: Database[];
  onDBSelect: (db: Database) => void;
}

export interface MasterSheetProps {
  selectedDB: Database;
  onBack: () => void;
}

export interface DatabaseListProps {
  databases: Database[];
  onDBSelect: (db: Database) => void;
}

export interface StatsCardProps {
  value: string;
  label: string;
  change: string;
  changeType: 'positive' | 'negative' | 'warning' | 'info';
  icon: React.ReactNode;
}

// Sidebar Item Type
export interface SidebarItem {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  active?: boolean;
  hasDropdown?: boolean;
}
