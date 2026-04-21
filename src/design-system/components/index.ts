/* ─── Design System Components ────────────────────────────────
 * Import: import { Button, Card, Modal } from "@/design-system/components"
 * ────────────────────────────────────────────────────────── */

/* P0 — Core */
export { Button } from "./button";
export { Input, Textarea } from "./input";
export { Card, CardHeader, CardContent } from "./card";
export { Modal, ModalTrigger, ModalClose, ModalContent } from "./modal";

/* P1 — Essential */
export {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
} from "./dropdown";
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "./tooltip";
export { Badge } from "./badge";
export { Chip } from "./chip";
export { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs";
export { Select } from "./select";

/* P2 — Supporting */
export { ScrollArea } from "./scroll-area";
export { Skeleton } from "./skeleton";
export { Separator } from "./separator";
export { Switch } from "./switch";
export { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "./accordion";
export { ToastProvider, useToast } from "./toast";
