import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Microscope, Activity, Users, FileText } from "lucide-react";

export default function Header() {
  const [location] = useLocation();
  
  const navigation = [
    { name: 'Home', href: '/', icon: Microscope },
    { name: 'Assessment', href: '/assessment', icon: Activity },
    { name: 'Providers', href: '/providers', icon: Users },
  ];

  return (
    <header className="bg-surface shadow-sm border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-medical-blue flex items-center cursor-pointer">
                <Microscope className="mr-2 h-7 w-7" />
                CareLens
              </h1>
            </Link>
            <nav className="ml-10">
              <div className="flex items-center space-x-8">
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
                        <Icon className="mr-2 h-4 w-4" />
                        {item.name}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
              <Badge variant="secondary" className="bg-medical-green/10 text-medical-green border-medical-green/20">
                <Activity className="mr-1 h-3 w-3" />
                AI-Powered
              </Badge>
              <Badge variant="secondary" className="bg-healthcare-teal/10 text-healthcare-teal border-healthcare-teal/20">
                <FileText className="mr-1 h-3 w-3" />
                HIPAA Compliant
              </Badge>
            </div>
            
            <Button variant="outline" size="sm" className="hidden sm:flex">
              <FileText className="mr-2 h-4 w-4" />
              User Guide
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
