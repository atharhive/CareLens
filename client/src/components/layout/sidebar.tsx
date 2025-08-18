import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, 
  Users, 
  FileText, 
  Home, 
  CheckCircle, 
  Circle, 
  Clock,
  HelpCircle,
  Settings
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className = "" }: SidebarProps) {
  const [location] = useLocation();
  
  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Assessment', href: '/assessment', icon: Activity },
    { name: 'Providers', href: '/providers', icon: Users },
  ];

  const quickActions = [
    { name: 'User Guide', icon: FileText, action: () => window.open('/user-guide', '_blank') },
    { name: 'Help & Support', icon: HelpCircle, action: () => console.log('Help clicked') },
    { name: 'Settings', icon: Settings, action: () => console.log('Settings clicked') },
  ];

  // Mock progress data - in real app this would come from assessment store
  const mockProgress = {
    completed: 6,
    total: 8,
    currentTask: 'API Client Configuration'
  };

  return (
    <div className={`w-80 bg-surface border-r border-border flex flex-col ${className}`}>
      {/* Progress Section */}
      <Card className="m-4 medical-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Setup Progress</CardTitle>
            <Badge variant="secondary" className="bg-medical-green/10 text-medical-green border-medical-green/20">
              <CheckCircle className="mr-1 h-3 w-3" />
              {mockProgress.completed}/{mockProgress.total} Complete
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Progress 
            value={(mockProgress.completed / mockProgress.total) * 100} 
            className="mb-4"
          />
          <div className="space-y-3">
            {/* Setup Steps */}
            {[
              { name: 'Project Structure', status: 'completed' },
              { name: 'Package Configuration', status: 'completed' },
              { name: 'TypeScript Setup', status: 'completed' },
              { name: 'Vite Configuration', status: 'completed' },
              { name: 'React Components', status: 'completed' },
              { name: 'Material-UI', status: 'completed' },
              { name: 'API Client', status: 'active' },
              { name: 'Dev Server', status: 'pending' },
            ].map((step, index) => (
              <div 
                key={index}
                className={`flex items-center p-3 rounded-lg ${
                  step.status === 'completed'
                    ? 'bg-medical-green/10 border border-medical-green/20'
                    : step.status === 'active'
                    ? 'bg-healthcare-teal/10 border border-healthcare-teal/20'
                    : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="mr-3">
                  {step.status === 'completed' ? (
                    <CheckCircle className="h-5 w-5 text-medical-green" />
                  ) : step.status === 'active' ? (
                    <Clock className="h-5 w-5 text-healthcare-teal" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div>
                  <div className={`font-medium ${
                    step.status === 'completed'
                      ? 'text-medical-green'
                      : step.status === 'active'
                      ? 'text-healthcare-teal'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {step.name}
                  </div>
                  {step.status === 'active' && (
                    <div className="text-xs text-gray-600 dark:text-gray-300">
                      {mockProgress.currentTask}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex-1 px-4">
        <nav className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Navigation
          </h3>
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || 
              (item.href !== '/' && location.startsWith(item.href));
            
            return (
              <Link key={item.name} href={item.href}>
                <span className={`
                  flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer
                  ${isActive 
                    ? 'text-medical-blue bg-blue-50 dark:bg-blue-950/20' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-800'
                  }
                `}>
                  <Icon className="mr-3 h-4 w-4" />
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Quick Actions */}
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Quick Actions
          </h3>
          <div className="space-y-2">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={action.action}
                  className="w-full justify-start text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
                >
                  <Icon className="mr-3 h-4 w-4" />
                  {action.name}
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Status Footer */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-2 text-sm">
          <div className="w-2 h-2 bg-medical-green rounded-full"></div>
          <span className="text-gray-600 dark:text-gray-300">
            Development server ready
          </span>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Last updated: 2 minutes ago
        </div>
      </div>
    </div>
  );
}
