from pathlib import Path
import re
ui=Path('packages/editor/src/components/ui')
for name,prim in [('dialog','Dialog'),('popover','Popover'),('tooltip','Tooltip'),('select','Select')]:
 f=ui/(name+'.tsx'); t=f.read_text().replace('from "radix-ui"',f'from "@base-ui/react/{name}"')
 t='import {useEditorUI} from "@/react/ui-context";\nimport {type Styled, type Renderable, renderProps, preventableFocus} from "./render-props";\n'+t
 t=re.sub(r'React.ComponentPropsWithoutRef<(typeof \w+\.\w+)>',r'Styled<React.ComponentPropsWithoutRef<\1>>',t)
 t=re.sub(r'(\w+).displayName =\s*\w+\.\w+.displayName;',r'\1.displayName = "\1";',t)
 t=t.replace(f'{prim}Primitive.Content',f'{prim}Primitive.Popup')
 t=t.replace(f'const {prim}Trigger = {prim}Primitive.Trigger;',f'''const {prim}Trigger = React.forwardRef<HTMLElement, Renderable<React.ComponentPropsWithoutRef<typeof {prim}Primitive.Trigger>>>((props, ref) => <{prim}Primitive.Trigger {{...renderProps(props)}} ref={{ref}} />);''')
 if name in ['popover','dialog']:
  t=t.replace(f'const {prim}Close = {prim}Primitive.Close;',f'''const {prim}Close = React.forwardRef<HTMLButtonElement, Renderable<React.ComponentPropsWithoutRef<typeof {prim}Primitive.Close>>>((props, ref) => <{prim}Primitive.Close {{...renderProps(props)}} ref={{ref}} />);''')
  t=t.replace(f'React.ComponentProps<typeof {prim}Primitive.Root>',f'Omit<React.ComponentProps<typeof {prim}Primitive.Root>, "onOpenChange"> & {{onOpenChange?: (open:boolean)=>void}}')
 if name=='dialog':
  t=t.replace('DialogPrimitive.Overlay','DialogPrimitive.Backdrop').replace('const DialogPortal = DialogPrimitive.Portal;','const DialogPortal = (props: React.ComponentProps<typeof DialogPrimitive.Portal>) => <DialogPrimitive.Portal container={useEditorUI().portalContainer} {...props} />;')
  t=t.replace('Styled<React.ComponentPropsWithoutRef<typeof DialogPrimitive.Popup>>','Styled<React.ComponentPropsWithoutRef<typeof DialogPrimitive.Popup>> & {onCloseAutoFocus?: (event:Event)=>void; onOpenAutoFocus?: (event:Event)=>void}')
  t=t.replace('({ className, children, ...props }, ref)', '({ className, children, onCloseAutoFocus, onOpenAutoFocus, ...props }, ref)')
  t=re.sub(r'onCloseAutoFocus=\{\(e\) => \{.*?\}\}', 'finalFocus={preventableFocus(onCloseAutoFocus, false)}\n            initialFocus={preventableFocus(onOpenAutoFocus)}',t,flags=re.S)
 if name=='popover':
  t=t.replace('const PopoverAnchor = PopoverPrimitive.Anchor;','') # unused by retained editor
  t=t.replace(', PopoverAnchor','')
  t=t.replace('Styled<React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Popup>>','Styled<React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Popup>> & Pick<PopoverPrimitive.Positioner.Props,"side"|"align"|"sideOffset"|"alignOffset"> & {onOpenAutoFocus?:(event:Event)=>void;onCloseAutoFocus?:(event:Event)=>void}')
  t=t.replace('align = "center", sideOffset = 4, ...props','align = "center", sideOffset = 4, side, alignOffset, onOpenAutoFocus, onCloseAutoFocus, ...props')
  t=t.replace('<PopoverPrimitive.Portal>','<PopoverPrimitive.Portal container={useEditorUI().portalContainer}>\n        <PopoverPrimitive.Positioner side={side} align={align} sideOffset={sideOffset} alignOffset={alignOffset} className="z-250">')
  t=t.replace('\n\t\t\talign={align}\n\t\t\tsideOffset={sideOffset}', '\n            initialFocus={preventableFocus(onOpenAutoFocus)}\n            finalFocus={preventableFocus(onCloseAutoFocus)}')
  t=t.replace('</PopoverPrimitive.Portal>','</PopoverPrimitive.Positioner>\n    </PopoverPrimitive.Portal>')
 if name=='tooltip':
  t=t.replace('const TooltipProvider = TooltipPrimitive.Provider;','const TooltipProvider = ({delayDuration, ...props}: React.ComponentProps<typeof TooltipPrimitive.Provider> & {delayDuration?:number}) => <TooltipPrimitive.Provider delay={delayDuration} {...props}/>;')
  t=t.replace('const Tooltip = TooltipPrimitive.Root;','const Tooltip = ({delayDuration, ...props}: React.ComponentProps<typeof TooltipPrimitive.Root> & {delayDuration?:number}) => <TooltipPrimitive.Provider delay={delayDuration}><TooltipPrimitive.Root {...props}/></TooltipPrimitive.Provider>;')
  t=t.replace('interface TooltipContentProps\n\textends Styled<React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Popup>>,\n\t\tVariantProps<typeof tooltipVariants> {}','type TooltipContentProps = Styled<React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Popup>> & VariantProps<typeof tooltipVariants> & Pick<TooltipPrimitive.Positioner.Props,"side"|"align"|"sideOffset">;')
  t=t.replace('sideOffset = 4, variant, ...props','sideOffset = 4, side, align, variant, ...props')
  t=t.replace('<TooltipPrimitive.Popup\n','<TooltipPrimitive.Portal container={useEditorUI().portalContainer}><TooltipPrimitive.Positioner side={side} align={align} sideOffset={sideOffset} className="z-250"><TooltipPrimitive.Popup\n')
  t=t.replace('\n\t\tsideOffset={sideOffset}','').replace('</TooltipPrimitive.Popup>','</TooltipPrimitive.Popup></TooltipPrimitive.Positioner></TooltipPrimitive.Portal>')
 if name=='select':
  t=t.replace('React.ComponentProps<typeof SelectPrimitive.Root>','Omit<SelectPrimitive.Root.Props<string, false>, "onValueChange" | "onOpenChange"> & {onValueChange?: (value:string)=>void;onOpenChange?: (open:boolean)=>void}')
  t=t.replace('\tonOpenChange,\n','\tonOpenChange,\n    onValueChange,\n')
  # Remove accidental insertion into useOverlayOpenChange args
  t=t.replace('\t\tonOpenChange,\n    onValueChange,','\t\tonOpenChange,')
  t=t.replace('open={open}\n', 'open={open}\n            onValueChange={(value)=>{if(value!==null)onValueChange?.(value)}}\n')
  t=t.replace('SelectPrimitive.ScrollUpButton','SelectPrimitive.ScrollUpArrow').replace('SelectPrimitive.ScrollDownButton','SelectPrimitive.ScrollDownArrow').replace('SelectPrimitive.Viewport','SelectPrimitive.List').replace('SelectPrimitive.Label','SelectPrimitive.GroupLabel')
  t=t.replace('<SelectPrimitive.Icon asChild>','<SelectPrimitive.Icon>')
  t=t.replace('Styled<React.ComponentPropsWithoutRef<typeof SelectPrimitive.Popup>>','Styled<React.ComponentPropsWithoutRef<typeof SelectPrimitive.Popup>> & Pick<SelectPrimitive.Positioner.Props,"side"|"align"|"sideOffset"> & {position?:"popper"|"item-aligned"}')
  t=t.replace('position = "popper", ...props','position = "popper", side, align, sideOffset=4, ...props')
  t=t.replace('<SelectPrimitive.Portal>','<SelectPrimitive.Portal container={useEditorUI().portalContainer}><SelectPrimitive.Positioner side={side} align={align} sideOffset={sideOffset} alignItemWithTrigger={position === "item-aligned"} className="z-250">')
  t=t.replace('\n\t\t\tposition={position}','')
  t=re.sub(r'onCloseAutoFocus=\{\(e\) => \{.*?\}\}', 'finalFocus={false}',t,flags=re.S)
  t=t.replace('</SelectPrimitive.Portal>','</SelectPrimitive.Positioner></SelectPrimitive.Portal>')
  t=t.replace('--radix-select-content-available-height','--available-height').replace('--radix-select-trigger-width','--anchor-width').replace('h-(--radix-select-trigger-height) ','')
 f.write_text(t)
