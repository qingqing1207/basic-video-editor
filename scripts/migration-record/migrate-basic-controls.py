from pathlib import Path
import re
root=Path('packages/editor/src')
ui=root/'components/ui'
# Drop website-only primitives, none are referenced by retained editor modules.
used=set()
for f in root.rglob('*'):
 if f.suffix not in ('.ts','.tsx') or ui in f.parents: continue
 used.update(re.findall(r'@/components/ui/([^"\']+)',f.read_text()))
while True:
 before=len(used)
 for name in list(used):
  f=ui/(name+'.tsx')
  if f.exists(): used.update(re.findall(r'@/components/ui/([^"\']+)',f.read_text()))
 if len(used)==before:break
for f in ui.glob('*.tsx'):
 if f.stem not in used:f.unlink()
# Namespace-compatible Base UI controls retain original classes.
for name,prim in [('checkbox','Checkbox'),('switch','Switch'),('tabs','Tabs'),('progress','Progress')]:
 f=ui/(name+'.tsx'); t=f.read_text().replace('from "radix-ui"',f'from "@base-ui/react/{name}"')
 t=re.sub(r'React.ComponentPropsWithoutRef<(typeof \w+\.\w+)>',r'Omit<React.ComponentPropsWithoutRef<\1>, "className"> & { className?: string }',t)
 t=re.sub(r'(\w+).displayName = \w+\.\w+.displayName;',r'\1.displayName = "\1";',t)
 t=t.replace('data-[state=checked]','data-checked').replace('data-[state=unchecked]','data-unchecked').replace('data-[state=active]','data-active')
 if name=='tabs':t=t.replace('TabsPrimitive.Trigger','TabsPrimitive.Tab').replace('TabsPrimitive.Content','TabsPrimitive.Panel')
 if name=='progress':t=t.replace('ref={ref}\n', 'ref={ref}\n        value={value}\n')
 f.write_text(t)
f=ui/'button.tsx';t=f.read_text().replace('import { Slot as SlotPrimitive } from "radix-ui";','import { Button as BaseButton } from "@base-ui/react/button";')
t=t.replace('asChild = false, ...props','asChild = false, children, ...props').replace('const Comp = asChild ? SlotPrimitive.Slot : "button";','const renderedChild = asChild ? React.Children.only(children) as React.ReactElement : undefined;').replace('<Comp','<BaseButton\n                render={renderedChild}\n                nativeButton={!asChild || renderedChild?.type === "button"}')
t=t.replace('{...props}\n\t\t\t/>','{...props}\n            >{asChild ? undefined : children}</BaseButton>');f.write_text(t)
f=ui/'label.tsx';t=f.read_text().replace('import { Label as LabelPrimitive } from "radix-ui";','').replace('React.ElementRef<typeof LabelPrimitive.Root>','HTMLLabelElement').replace('React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>','React.ComponentPropsWithoutRef<"label">').replace('<LabelPrimitive.Root','<label').replace('LabelPrimitive.Root.displayName','"Label"');f.write_text(t)
f=ui/'separator.tsx';t=f.read_text().replace('import * as SeparatorPrimitive from "@radix-ui/react-separator";','import { Separator as BaseSeparator } from "@base-ui/react/separator";').replace('SeparatorPrimitive.Root','BaseSeparator').replace('React.ComponentPropsWithoutRef<typeof BaseSeparator>','Omit<React.ComponentPropsWithoutRef<typeof BaseSeparator>, "className"> & { className?: string; decorative?: boolean }').replace('decorative={decorative}','role={decorative ? "presentation" : "separator"}').replace('BaseSeparator.displayName','"Separator"');f.write_text(t)
f=ui/'aspect-ratio.tsx';f.write_text('''import * as React from "react";
export function AspectRatio({ratio=1,style,...props}:React.HTMLAttributes<HTMLDivElement> & {ratio?:number}){return <div {...props} style={{...style,aspectRatio:ratio}}/>;}
''')
f=ui/'slider.tsx';t=f.read_text().replace('from "radix-ui"','from "@base-ui/react/slider"').replace('React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>','Omit<SliderPrimitive.Root.Props<number[]>, "className" | "onValueCommitted"> & { onValueCommit?: (value: number[]) => void }').replace('({ className, ...props }','({ className, onValueCommit, ...props }').replace('ref={ref}','ref={ref}\n        onValueCommitted={onValueCommit}').replace('<SliderPrimitive.Track','<SliderPrimitive.Control className="relative flex w-full touch-none items-center select-none">\n        <SliderPrimitive.Track').replace('SliderPrimitive.Range','SliderPrimitive.Indicator').replace('</SliderPrimitive.Root>','</SliderPrimitive.Control>\n    </SliderPrimitive.Root>').replace('SliderPrimitive.Root.displayName','"Slider"');f.write_text(t)
