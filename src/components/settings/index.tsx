"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryState } from "nuqs";
import { CanvasSettings } from "./canvas";
import { StudioSettings } from "./studio";
import { AccountSettings } from "./account";
import { BillingSettings } from "./billing";

export function Settings() {
  const [tab, setTab] = useQueryState("tab", {
    defaultValue: "canvas",
  });

  const tabs = [
    {
      id: "canvas",
      title: "Canvas",
    },
    {
      id: "studio",
      title: "Studio",
    },
    {
      id: "account",
      title: "Account",
    },
    {
      id: "billing",
      title: "Billing",
    },
  ];

  return (
    <Tabs value={tab} onValueChange={setTab} className="w-full px-4 md:px-8">
      <div className="flex items-center justify-between mb-4 mt-5 max-w-screen-xl">
        <TabsList className="justify-start rounded-none h-auto p-0 pb-4 bg-transparent space-x-6">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="rounded-none border-b-2 border-transparent text-secondary data-[state=active]:border-white data-[state=active]:bg-transparent px-0 py-2"
            >
              {tab.title}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <TabsContent value="canvas">
        <CanvasSettings />
      </TabsContent>

      <TabsContent value="studio">
        <StudioSettings />
      </TabsContent>

      <TabsContent value="account">
        <AccountSettings />
      </TabsContent>

      <TabsContent value="billing">
        <BillingSettings />
      </TabsContent>
    </Tabs>
  );
}
