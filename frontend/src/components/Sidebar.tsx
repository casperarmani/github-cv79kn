import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MessageSquare,
  Upload,
  History as HistoryIcon,
  Settings,
  ChevronDown,
  LogOut,
  User,
  PanelLeftClose,
  PanelLeft,
  Book,
  Boxes,
  Plus,
  CreditCard,
} from "lucide-react";
import { Chat } from '@/types';

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  chats: Chat[];
  currentChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (chatId: string) => void;
}

export function Sidebar({ 
  className, 
  chats, 
  currentChatId, 
  onNewChat, 
  onSelectChat 
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div 
      className={cn(
        "flex flex-col pb-4 border-r min-h-screen transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-64",
        className
      )}
    >
      <div className="px-3 py-2">
        <div className="flex items-center justify-between h-14">
          <div className={cn(
            "flex items-center gap-2 overflow-hidden transition-all duration-300 ease-in-out",
            isCollapsed ? "w-0 opacity-0" : "w-[176px] opacity-100"
          )}>
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src="/logo.png" alt="Video Analysis" />
              <AvatarFallback>VA</AvatarFallback>
            </Avatar>
            <div className="truncate">
              <h2 className="text-lg font-semibold truncate">Video Analysis</h2>
              <p className="text-xs text-muted-foreground truncate">AI Chatbot</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      <Separator />
      <div className="px-3 py-2">
        <Button
          onClick={onNewChat}
          className={cn(
            "w-full justify-start mb-2",
            isCollapsed ? "px-2" : "px-4"
          )}
        >
          <Plus className="h-4 w-4 shrink-0" />
          <span className={cn(
            "ml-2 transition-all duration-300 ease-in-out overflow-hidden",
            isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
          )}>New Chat</span>
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="px-3 py-2">
          <h2 className={cn(
            "mb-2 px-4 text-lg font-semibold tracking-tight transition-all duration-300 ease-in-out",
            isCollapsed && "opacity-0 h-0 mb-0"
          )}>
            Recent Chats
          </h2>
          <div className="space-y-1">
            {chats.length > 0 ? (
              chats.map((chat) => (
                <Button
                  key={chat.id}
                  variant={currentChatId === chat.id ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start transition-all duration-300 ease-in-out",
                    isCollapsed ? "px-2" : "px-4"
                  )}
                  onClick={() => onSelectChat(chat.id)}
                >
                  <MessageSquare className="h-4 w-4 shrink-0" />
                  {!isCollapsed && (
                    <span className="ml-2 truncate">{chat.title}</span>
                  )}
                </Button>
              ))
            ) : (
              <div className="text-sm text-muted-foreground px-4 py-2">
                No chats available
              </div>
            )}
          </div>
        </div>
        <Separator className="my-2" />
        <div className="px-3 py-2">
          <div className="space-y-1">
            <Button variant="ghost" className={cn(
              "w-full justify-start transition-all duration-300 ease-in-out",
              isCollapsed ? "px-2" : "px-4"
            )}>
              <Upload className="h-4 w-4 shrink-0" />
              <span className={cn(
                "ml-2 transition-all duration-300 ease-in-out overflow-hidden",
                isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
              )}>Upload Video</span>
            </Button>
            <Button variant="ghost" className={cn(
              "w-full justify-start transition-all duration-300 ease-in-out",
              isCollapsed ? "px-2" : "px-4"
            )}>
              <HistoryIcon className="h-4 w-4 shrink-0" />
              <span className={cn(
                "ml-2 transition-all duration-300 ease-in-out overflow-hidden",
                isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
              )}>History</span>
            </Button>
          </div>
        </div>
        <Separator className="my-2" />
        <div className="px-3 py-2">
          <h2 className={cn(
            "mb-2 px-4 text-lg font-semibold tracking-tight transition-all duration-300 ease-in-out",
            isCollapsed && "opacity-0 h-0 mb-0"
          )}>
            Resources
          </h2>
          <div className="space-y-1">
            <Button variant="ghost" className={cn(
              "w-full justify-start transition-all duration-300 ease-in-out",
              isCollapsed ? "px-2" : "px-4"
            )}>
              <Book className="h-4 w-4 shrink-0" />
              <span className={cn(
                "ml-2 transition-all duration-300 ease-in-out overflow-hidden",
                isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
              )}>Documentation</span>
            </Button>
            <Button variant="ghost" className={cn(
              "w-full justify-start transition-all duration-300 ease-in-out",
              isCollapsed ? "px-2" : "px-4"
            )}>
              <Boxes className="h-4 w-4 shrink-0" />
              <span className={cn(
                "ml-2 transition-all duration-300 ease-in-out overflow-hidden",
                isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
              )}>Models</span>
            </Button>
            <Button variant="ghost" className={cn(
              "w-full justify-start transition-all duration-300 ease-in-out",
              isCollapsed ? "px-2" : "px-4"
            )}>
              <Settings className="h-4 w-4 shrink-0" />
              <span className={cn(
                "ml-2 transition-all duration-300 ease-in-out overflow-hidden",
                isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
              )}>Settings</span>
            </Button>
          </div>
        </div>
      </ScrollArea>
      <Separator className="my-2" />
      <div className="px-3 py-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className={cn(
              "w-full justify-start transition-all duration-300 ease-in-out",
              isCollapsed ? "px-2" : "px-4"
            )}>
              <Avatar className="h-8 w-8">
                <AvatarImage src="/avatar.png" alt="User" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div className={cn(
                "ml-2 flex items-center gap-2 transition-all duration-300 ease-in-out overflow-hidden",
                isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
              )}>
                <div className="flex flex-col flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.email || 'User'}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
                <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align={isCollapsed ? "center" : "start"} side="top">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Billing</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}