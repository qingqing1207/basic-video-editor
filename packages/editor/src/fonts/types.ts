export interface FontOption {
  value: string;
  label: string;
  category: "system" | "local" | "custom";
  weights?: number[];
}
