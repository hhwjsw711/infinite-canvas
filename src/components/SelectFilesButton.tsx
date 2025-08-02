import * as React from "react";
import { Button } from "./ui/button";
import { Plus } from "lucide-react";

type ActionButtonsProps = {
  onAddClick: () => void;
};

export const AddItemsButton: React.FC<ActionButtonsProps> = ({
  onAddClick,
}) => {
  return (
    <>
      <Button
        size="icon"
        variant="outline"
        onClick={onAddClick}
        className="fixed bottom-8 right-8 rounded-full w-16 h-16 shadow-lg bg-background hover:bg-primary/10 border-primary/20 p-0 flex items-center justify-center"
      >
        <Plus className="w-10 h-10 text-primary" />
      </Button>
    </>
  );
};
