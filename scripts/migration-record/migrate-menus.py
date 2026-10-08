from pathlib import Path
import re
ui=Path('packages/editor/src/components/ui')
for name,prim,base in [('context-menu','ContextMenu','ContextMenu'),('dropdown-menu','DropdownMenu','Menu')]:
 f=ui/(name+'.tsx'); t=f.read_text().replace(f'import {{ {prim} as {prim}Primitive }} from "radix-ui";',f'import {{ {base} as {prim}Primitive }} from "@base-ui/react/{"menu" if base=="Menu" else name}";')
 t='import {useEditorUI} from "@/react/ui-context";\nimport {type Styled,type Renderable,renderProps} from "./render-props";\n'+t
 t=re.sub(r'React.ComponentPropsWithoutRef<(typeof \w+\.\w+)>',r'Styled<React.ComponentPropsWithoutRef<\1>>',t)
 t=re.sub(r'(\w+).displayName =\s*\w+\.\w+.displayName;',r'\1.displayName = "\1";',t)
 t=t.replace(f'React.ComponentProps<typeof {prim}Primitive.Root>',f'Omit<React.ComponentProps<typeof {prim}Primitive.Root>, "onOpenChange"> & {{onOpenChange?: (open:boolean)=>void}}')
 t=t.replace(f'const {prim}Trigger = {prim}Primitive.Trigger;',f'const {prim}Trigger = React.forwardRef<{"HTMLDivElement" if base=="ContextMenu" else "HTMLButtonElement"}, Renderable<React.ComponentPropsWithoutRef<typeof {prim}Primitive.Trigger>>>((props,ref)=><{prim}Primitive.Trigger {{...renderProps(props)}} ref={{ref}}/>);')
 t=t.replace(f'const {prim}Portal = {prim}Primitive.Portal;',f'const {prim}Portal = (props: React.ComponentProps<typeof {prim}Primitive.Portal>) => <{prim}Primitive.Portal container={{useEditorUI().portalContainer}} {{...props}}/>;')
 t=t.replace(f'{prim}Primitive.Sub;',f'{prim}Primitive.SubmenuRoot;').replace(f'{prim}Primitive.SubTrigger',f'{prim}Primitive.SubmenuTrigger')
 t=t.replace(f'{prim}Primitive.SubContent',f'{prim}Primitive.Popup').replace(f'{prim}Primitive.Content',f'{prim}Primitive.Popup').replace(f'{prim}Primitive.Label',f'{prim}Primitive.GroupLabel')
 # Portalled submenu with Base UI positioning and keyboard handling.
 start=t.index(f'const {prim}SubContent =');end=t.index(f'const {prim}Content =',start)
 section=t[start:end]
 section=section.replace(f'<{prim}Primitive.Popup\n',f'<{prim}Portal><{prim}Primitive.Positioner side="right" align="start" sideOffset={{4}} className="z-250"><{prim}Primitive.Popup\n').replace('\n\t/>','\n\t/></'+prim+'Primitive.Positioner></'+prim+'Portal>')
 t=t[:start]+section+t[end:]
 start=t.index(f'const {prim}Content =');end=t.index(f'const {prim}Item =',start)
 section=t[start:end].replace(f'Styled<React.ComponentPropsWithoutRef<typeof {prim}Primitive.Popup>>',f'Styled<React.ComponentPropsWithoutRef<typeof {prim}Primitive.Popup>> & Pick<{prim}Primitive.Positioner.Props,"side"|"align"|"sideOffset">')
 section=section.replace('className, container, ...props','className, container, side, align, sideOffset=4, ...props').replace('className, sideOffset = 4, ...props','className, sideOffset = 4, side, align, ...props')
 section=section.replace(f'<{prim}Primitive.Portal container={{container ?? undefined}}>',f'<{prim}Portal container={{container ?? useEditorUI().portalContainer}}>')
 section=section.replace(f'<{prim}Primitive.Portal>',f'<{prim}Portal>').replace(f'</{prim}Primitive.Portal>',f'</{prim}Portal>')
 section=section.replace(f'<{prim}Primitive.Popup\n',f'<{prim}Primitive.Positioner side={{side}} align={{align}} sideOffset={{sideOffset}} className="z-250"><{prim}Primitive.Popup\n').replace('\n\t\t\tsideOffset={sideOffset}','').replace(f'</{prim}Portal>',f'</{prim}Primitive.Positioner></{prim}Portal>')
 section=re.sub(r'onCloseAutoFocus=\{\(e\) => \{.*?\}\}', 'finalFocus={false}',section,flags=re.S)
 t=t[:start]+section+t[end:]
 # onSelect call sites are migrated to Base UI onClick below.
 t=t.replace(f'Styled<React.ComponentPropsWithoutRef<typeof {prim}Primitive.Item>>',f'Renderable<Styled<React.ComponentPropsWithoutRef<typeof {prim}Primitive.Item>>>')
 t=t.replace('asChild={asChild}','render={asChild ? renderedChildren as React.ReactElement : undefined}').replace('{renderedChildren}','{asChild ? undefined : renderedChildren}')
 t=re.sub(r'onSelect=\{\(e\) => \{\s*e.preventDefault\(\);\s*\}\}', 'closeOnClick={false}',t)
 # Indicators are distinct components in Base UI.
 start=t.index(f'const {prim}CheckboxItem =');end=t.index(f'const {prim}RadioItem =',start)
 t=t[:start]+t[start:end].replace(f'{prim}Primitive.ItemIndicator',f'{prim}Primitive.CheckboxItemIndicator')+t[end:]
 t=t.replace(f'{prim}Primitive.ItemIndicator',f'{prim}Primitive.RadioItemIndicator')
 t=t.replace('data-[state=open]','data-open')
 f.write_text(t)
# Native radio visual preserved on Base Radio primitives.
f=ui/'radio-group.tsx';t=f.read_text().replace('import { RadioGroup as RadioGroupPrimitive } from "radix-ui";','import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";\nimport { Radio } from "@base-ui/react/radio";\nimport {type Styled} from "./render-props";')
t=t.replace('RadioGroupPrimitive.Root','BaseRadioGroup').replace('RadioGroupPrimitive.Item','Radio.Root').replace('RadioGroupPrimitive.Indicator','Radio.Indicator')
t=re.sub(r'React.ComponentPropsWithoutRef<(typeof [\w.]+)>',r'Styled<React.ComponentPropsWithoutRef<\1>>',t)
t=re.sub(r'(\w+).displayName = [\w.]+;',r'\1.displayName = "\1";',t);f.write_text(t)
# Sheets keep the original side geometry and motion classes.
f=ui/'sheet.tsx';t=f.read_text().replace('from "radix-ui"','from "@base-ui/react/dialog"')
t='import {useEditorUI} from "@/react/ui-context";\nimport {type Styled,type Renderable,renderProps} from "./render-props";\n'+t
for part in ['Trigger','Close']:
 t=t.replace(f'const Sheet{part} = SheetPrimitive.{part};',f'const Sheet{part} = React.forwardRef<HTMLButtonElement,Renderable<React.ComponentPropsWithoutRef<typeof SheetPrimitive.{part}>>>((props,ref)=><SheetPrimitive.{part} {{...renderProps(props)}} ref={{ref}}/>);')
t=t.replace('const SheetPortal = SheetPrimitive.Portal;','const SheetPortal = (props:React.ComponentProps<typeof SheetPrimitive.Portal>)=><SheetPrimitive.Portal container={useEditorUI().portalContainer} {...props}/>;')
t=t.replace('React.ComponentProps<typeof SheetPrimitive.Root>','Omit<React.ComponentProps<typeof SheetPrimitive.Root>,"onOpenChange"> & {onOpenChange?:(open:boolean)=>void}')
t=t.replace('SheetPrimitive.Overlay','SheetPrimitive.Backdrop').replace('SheetPrimitive.Content','SheetPrimitive.Popup')
t=re.sub(r'React.ComponentPropsWithoutRef<(typeof \w+\.\w+)>',r'Styled<React.ComponentPropsWithoutRef<\1>>',t)
t=re.sub(r'(\w+).displayName = [\w.]+;',r'\1.displayName = "\1";',t)
t=re.sub(r'onOpenAutoFocus=\{\(e\) => \{.*?\}\}', 'initialFocus={false}',t,flags=re.S)
t=t.replace('data-[state=open]','data-open').replace('data-[state=closed]','data-closed')
f.write_text(t)
for name in ['dialog','popover','tooltip']:
 f=ui/(name+'.tsx');f.write_text(f.read_text().replace('React.forwardRef<HTMLElement, Renderable','React.forwardRef<HTMLButtonElement, Renderable'))
