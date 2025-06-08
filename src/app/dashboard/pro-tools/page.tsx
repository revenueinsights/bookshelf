'use client';

import { useState } from 'react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { 
  TrendingUp, 
  Package, 
  Gem, 
  BarChart3,
  ArrowRight,
  DollarSign,
  Clock,
  Target,
  Zap,
  CheckCircle
} from 'lucide-react';

export default function ProToolsPage() {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  const tools = [
    {
      id: 'hot-flip-deals',
      title: 'Hot Flip Deals',
      icon: TrendingUp,
      gradient: 'from-emerald-500 to-teal-600',
      description: 'Discover high-profit book flipping opportunities with real-time market analysis and automated deal detection.',
      features: [
        'Real-time deal alerts',
        'Profit margin analysis',
        'Risk assessment',
        'Market trend tracking'
      ],
      status: 'active'
    },
    {
      id: 'bulk-liquidation',
      title: 'Bulk Liquidation',
      icon: Package,
      gradient: 'from-blue-500 to-indigo-600',
      description: 'Efficiently liquidate inventory with intelligent vendor matching and bulk processing capabilities.',
      features: [
        'Bulk ISBN processing',
        'Vendor price comparison',
        'Automated matching',
        'Export capabilities'
      ],
      status: 'active'
    },
    {
      id: 'high-resale-value',
      title: 'Market Intelligence',
      icon: Gem,
      gradient: 'from-amber-500 to-orange-600',
      description: 'Advanced analytics for identifying high-value books and optimal selling strategies.',
      features: [
        'Popular ISBN tracking',
        'Category performance',
        'Trend analysis',
        'Strategy optimization'
      ],
      status: 'coming-soon'
    },
    {
      id: 'price-history',
      title: 'Price Analytics',
      icon: BarChart3,
      gradient: 'from-purple-500 to-violet-600',
      description: 'Comprehensive price history analysis with volatility tracking and timing optimization.',
      features: [
        'Historical price data',
        'Volatility analysis',
        'Seasonal patterns',
        'Optimal timing'
      ],
      status: 'coming-soon'
    }
  ];

  const openTool = (toolId: string) => {
    setSelectedTool(toolId);
    window.location.href = `/dashboard/pro-tools/${toolId}`;
  };

  return (
    <div className="space-y-8">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900 dark:to-gray-900 rounded-2xl"></div>
        <div className="relative p-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Pro Tools Suite
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Professional-grade tools for advanced book trading and market analysis
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {tools.map((tool) => {
          const IconComponent = tool.icon;
          const isActive = tool.status === 'active';
          
          return (
            <div
              key={tool.id}
              className={`group relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 ${
                isActive 
                  ? 'hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-gray-900/50 cursor-pointer hover:-translate-y-1' 
                  : 'opacity-75'
              }`}
              onClick={() => isActive && openTool(tool.id)}
            >
              {/* Gradient Header */}
              <div className={`h-2 bg-gradient-to-r ${tool.gradient}`}></div>
              
              <div className="p-8">
                {/* Icon and Title */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className={`p-4 bg-gradient-to-r ${tool.gradient} rounded-xl shadow-lg`}>
                      <IconComponent className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                        {tool.title}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {isActive ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                            <Clock className="w-3 h-3 mr-1" />
                            Coming Soon
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  {tool.description}
                </p>

                {/* Features */}
                <div className="space-y-3 mb-8">
                  {tool.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${tool.gradient}`}></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Action Button */}
                {isActive ? (
                  <button className={`w-full bg-gradient-to-r ${tool.gradient} text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 group-hover:shadow-lg`}>
                    <span>Launch Tool</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                ) : (
                  <button className="w-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-medium py-3 px-6 rounded-xl cursor-not-allowed">
                    Coming Soon
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* API Access Section */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20"></div>
        <div className="relative p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1 mb-6 lg:mb-0">
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <Target className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    BookScouter API Access
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">
                    Enterprise-grade API for real-time book pricing and market data
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <DollarSign className="h-4 w-4 text-green-600 dark:text-green-300" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Real-time pricing</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Clock className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">99.9% uptime</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <Target className="h-4 w-4 text-purple-600 dark:text-purple-300" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Enterprise support</span>
                </div>
              </div>
            </div>
            
            <div className="lg:ml-8">
              <button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium py-3 px-8 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 