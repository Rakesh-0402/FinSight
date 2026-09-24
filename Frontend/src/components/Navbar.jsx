import {
  Menu,
  Home,
  User,
  LogOut,
} from "lucide-react";
import NotificationsBell from "./NotificationsBell";
import {useNavigate} from "react-router-dom";

import {Avatar,AvatarFallback} from "@/components/ui/avatar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Navbar({setMobileSidebarOpen}) {
  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("user") ||"{}"
  );

  const initial = user?.name?.charAt(0)?.toUpperCase() || "U";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem( "activeChatId");

    navigate("/login", {
      replace: true,
    });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl transition-colors dark:border-slate-800 dark:bg-[#081321]/90 sm:px-6">

      {/* LEFT */}
      <div className="flex items-center gap-3">

        {/* Mobile menu */}
        <button
          onClick={() =>setMobileSidebarOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 lg:hidden dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          title="Open menu"
        >
          <Menu size={20} />
        </button>

        {/* Mobile brand */}
        <div className="lg:hidden">
          <p className="text-sm font-bold tracking-tight text-[#07111F] dark:text-white">
            FinSight
          </p>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-1 sm:gap-2">

        {/* Home */}
        <Tooltip>
          <TooltipTrigger
            render={
              <button 
                onClick={() =>navigate("/")}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <Home size={19} />
              </button>
            }
          />

          <TooltipContent>
            Home
          </TooltipContent>
        </Tooltip>

        {/* Notifications */}
        <Tooltip>
          <TooltipTrigger
            render={
              <div>
                <NotificationsBell />
              </div>
            }
          />

          <TooltipContent>
            Notifications
          </TooltipContent>
        </Tooltip>

        {/* Divider */}

        <div className="mx-1 hidden h-7 w-px bg-slate-200 sm:block dark:bg-slate-800" />
        {/* PROFILE DROPDOWN */}

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-slate-100 dark:hover:bg-slate-800">

                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-[#07111F] text-sm font-semibold text-white dark:bg-white dark:text-[#07111F]">
                    {initial}
                  </AvatarFallback>
                </Avatar>

                <div className="hidden min-w-0 text-left sm:block">
                  <p className="max-w-36 truncate text-sm font-semibold text-slate-800 dark:text-white">
                    {user?.name || "User"}
                  </p>

                  <p className="max-w-36 truncate text-xs text-slate-400 dark:text-slate-500">
                    {user?.email || "FinSight account"}
                  </p>
                </div>
              </button>
            }
          />

          <DropdownMenuContent
            align="end"
            className="w-56"
          >
          <DropdownMenuGroup>
            <DropdownMenuLabel>
              <div>
                <p className="text-sm font-semibold">
                  {user?.name || "User"}
                </p>

                <p className="mt-0.5 truncate text-xs font-normal text-slate-500">
                  {user?.email || ""}
                </p>
              </div>
            </DropdownMenuLabel>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={() =>navigate("/profile")}
            >
              <User size={16} />
              Profile
            </DropdownMenuItem>

          </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
            >
              <LogOut size={16} />
              Logout
            </DropdownMenuItem>
          </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}