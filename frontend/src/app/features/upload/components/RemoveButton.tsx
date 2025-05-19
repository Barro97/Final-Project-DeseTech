import { X } from "lucide-react";
import { Button } from "@/app/components/ui/button";

function RemoveButton({
  removeFunc,
  id,
  prefix,
}: {
  removeFunc: (id: string) => void;
  id: string;
  prefix: string;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => removeFunc(id)}
      className="h-8 w-8"
    >
      <X className="h-4 w-4" />
      <span className="sr-only">{prefix}</span>
    </Button>
  );
}
export default RemoveButton;
