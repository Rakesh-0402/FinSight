import {
  LayoutDashboard,
  ReceiptText,
  Upload,
  BarChart3,
  TrendingUp,
  ShieldAlert,
  Bot,
  LogOut,
  ChevronLeft,
  ChevronRight,
  WalletCards,
} from "lucide-react";

import {NavLink,useNavigate} from "react-router-dom";

import {Sheet,SheetContent} from "@/components/ui/sheet";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Sidebar({
  sidebarOpen,
  setSidebarOpen,
  mobileSidebarOpen,
  setMobileSidebarOpen,
}) {
  const navigate = useNavigate();

  const menuSections = [
    {
      title: "Overview",
      items: [
        {
          label: "Dashboard",
          path: "/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },

    {
      title: "Money",
      items: [
        {
          label: "Transactions",
          path: "/transactions",
          icon: ReceiptText,
        },
        {
          label: "Upload",
          path: "/upload",
          icon: Upload,
        },
      ],
    },

    {
      title: "Intelligence",
      items: [
        {
          label: "Analytics",
          path: "/analytics",
          icon: BarChart3,
        },
        {
          label: "Forecast",
          path: "/forecast",
          icon: TrendingUp,
        },
        {
          label: "Anomalies",
          path: "/anomalies",
          icon: ShieldAlert,
        },
      ],
    },

    {
      title: "Assistant",
      items: [
        {
          label: "AI Assistant",
          path: "/chatbot",
          icon: Bot,
        },
      ],
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem(
      "activeChatId"
    );

    navigate("/login", {
      replace: true,
    });
  };

  const NavItem = ({
    label,
    path,
    Icon,
    mobile = false,
  }) => {
    const link = (
      <NavLink
        to={path}
        onClick={() => {
          if (mobile) {
            setMobileSidebarOpen(false);
          }
        }}
        className={({ isActive }) =>
          `group flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
            isActive
              ? "bg-[#4F6BFF]/10 text-[#4F6BFF] dark:bg-[#4F6BFF]/15 dark:text-[#8EA0FF]"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-white"
          } ${
            !mobile &&
            !sidebarOpen
              ? "justify-center"
              : "gap-3"
          }`
        }
      >
        <Icon
          size={19}
          strokeWidth={1.9}
          className="shrink-0"
        />

        {(mobile ||
          sidebarOpen) && (
          <span className="truncate">
            {label}
          </span>
        )}
      </NavLink>
    );

    if ( mobile ||sidebarOpen) {
      return link;
    }

    return (
      <Tooltip>
        <TooltipTrigger
          render={link}
        />

        <TooltipContent
          side="right"
          sideOffset={10}
        >
          {label}
        </TooltipContent>
      </Tooltip>
    );
  };

  const Navigation = ({mobile = false}) => (
    <nav className="flex-1 overflow-y-auto px-3 py-5">
      <div className="space-y-6">
        {menuSections.map(
          (section) => (
            <div
              key={section.title}
            >
              {(mobile || sidebarOpen) && (
                <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                  {section.title}
                </p>
              )}

              <div className="space-y-1">
                {section.items.map(
                  ({
                    label,
                    path,
                    icon: Icon,
                  }) => (
                    <NavItem
                      key={path}
                      label={label}
                      path={path}
                      Icon={Icon}
                      mobile={
                        mobile
                      }
                    />
                  )
                )}
              </div>
            </div>
          )
        )}
      </div>
    </nav>
  );

  const Brand = ({mobile = false}) => (
    <div className="flex h-16 items-center border-b border-slate-200/80 px-4 dark:border-slate-800">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#07111F] text-white shadow-sm dark:bg-white dark:text-[#07111F]">
          <WalletCards
            size={19}
          />
        </div>

        {(mobile ||
          sidebarOpen) && (
          <div className="min-w-0">
            <p className="truncate text-sm font-bold tracking-tight text-[#07111F] dark:text-white">
              FinSight
            </p>

            <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
              Financial Intelligence
            </p>
          </div>
        )}
      </div>

      {!mobile &&
        sidebarOpen && (
          <button
            onClick={() =>
              setSidebarOpen(
                false
              )
            }
            className="hidden h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 lg:flex dark:hover:bg-slate-800 dark:hover:text-white"
            title="Collapse sidebar"
          >
            <ChevronLeft
              size={18}
            />
          </button>
        )}
    </div>
  );

  const LogoutButton = ({mobile = false}) => {
    const button = (
      <button
        onClick={handleLogout}
        className={`flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 transition hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-950/30 ${
          !mobile &&
          !sidebarOpen
            ? "justify-center"
            : "gap-3"
        }`}
      >
        <LogOut
          size={19}
          className="shrink-0"
        />

        {(mobile ||
          sidebarOpen) && (
          <span>
            Logout
          </span>
        )}
      </button>
    );

    if (mobile ||sidebarOpen) {
      return button;
    }

    return (
      <Tooltip>
        <TooltipTrigger
          render={button}
        />
        <TooltipContent
          side="right"
          sideOffset={10}
        >
          Logout
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <>
      {/* DESKTOP SIDEBAR */}

      <aside
        className={`fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-slate-200/80 bg-white/95 backdrop-blur-xl transition-[width] duration-300 lg:flex dark:border-slate-800 dark:bg-[#081321]/95 ${
          sidebarOpen
            ? "w-64"
            : "w-20"
        }`}
      >
        <Brand />
        {/* Expand button */}

        {!sidebarOpen && (
          <div className="flex justify-center border-b border-slate-100 py-3 dark:border-slate-800">
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    onClick={() =>setSidebarOpen(true)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
                  >
                    <ChevronRight size={18}/>
                  </button>
                }
              />

              <TooltipContent
                side="right"
                sideOffset={10}
              >
                Expand sidebar
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        <Navigation />

        <div className="border-t border-slate-200/80 p-3 dark:border-slate-800">
          <LogoutButton />
        </div>
      </aside>

      {/*MOBILE SIDEBAR shadcn Sheet */}

      <Sheet
        open={mobileSidebarOpen}
        onOpenChange={setMobileSidebarOpen}
      >
        <SheetContent
          side="left"
          className="flex w-[86vw] max-w-72 flex-col gap-0 border-r border-slate-200 bg-white p-0 dark:border-slate-800 dark:bg-[#081321]"
        >
          <Brand mobile />
          <Navigation mobile />

          <div className="border-t border-slate-200/80 p-3 dark:border-slate-800">
            <LogoutButton mobile />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}