import { EditorCore } from "@/core";
export const loadFullFont = ({
  family,
}: {
  family: string;
  weights?: number[];
}) => EditorCore.getInstance().fonts.load(family);
export const loadFonts = ({ families }: { families: string[] }) =>
  EditorCore.getInstance().fonts.loadMany(families);
