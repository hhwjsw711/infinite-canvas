import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface SwitchCardProps {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => Promise<void>;
}

export function SwitchCard({
  title,
  description,
  checked,
  onChange,
}: SwitchCardProps) {
  const [isChanging, setIsChanging] = useState(false);
  const { toast } = useToast();

  const handleChange = async (newChecked: boolean) => {
    try {
      setIsChanging(true);
      await onChange(newChecked);
      toast({
        title: "Success",
        description: "Setting updated",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to update",
        variant: "destructive",
      });
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
          <Switch
            checked={checked}
            onCheckedChange={handleChange}
            disabled={isChanging}
          />
        </div>
      </CardHeader>
    </Card>
  );
}
