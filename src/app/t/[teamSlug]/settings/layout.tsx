import { SettingsMenu } from "./SettingsMenu";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container sm:grid grid-cols-[12rem_minmax(0,1fr)] gap-6 px-4">
      <aside className="sticky hidden sm:block top-[calc(6rem+1px)] h-[calc(100vh-(6rem+1px))] py-8">
        <SettingsMenu />
      </aside>
      <main className="min-h-[calc(100vh-(6rem+1px))] flex flex-col gap-6 max-w-3xl">
        {children}
      </main>
    </div>
  );
}
