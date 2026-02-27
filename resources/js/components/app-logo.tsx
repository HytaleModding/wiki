import HytaleModdingLogo from './hytale-modding-logo';

export default function AppLogo() {
  return (
    <>
      <div className="flex aspect-square size-8 items-center justify-center rounded-md text-sidebar-primary-foreground">
        <HytaleModdingLogo
          variant="icon"
          className="size-5 fill-current text-white dark:text-black"
        />
      </div>
      <div className="ml-1 grid flex-1 text-left text-sm">
        <span className="mb-0.5 truncate text-xl leading-tight font-semibold">
          Hytale Modding
        </span>
      </div>
    </>
  );
}
