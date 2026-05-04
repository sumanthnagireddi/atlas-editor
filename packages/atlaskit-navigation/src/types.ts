export type NavigationItem = {
  id: string;
  title: string;
  description?: string;
  disabled?: boolean;
  badge?: string;
  children?: NavigationItem[];
};

export interface AtlaskitNavigationProps {
  activeItem?: string;
  onSelect: (itemId: string) => void;
}

export interface AtlaskitNavigationElement extends HTMLElement {
  activeItem: string;
}
