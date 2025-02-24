"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Clock, MessageSquare, User, Bot } from "lucide-react";

interface MetricDialProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

interface SessionMetricsProps {
  metrics: {
    timeSpent: string;
    totalMessages: number;
    userMessages: number;
    assistantMessages: number;
  }
}

const MetricDial: React.FC<MetricDialProps> = ({ title, value, icon, color }) => (
  <div className="relative flex flex-col items-center p-4 rounded-lg bg-white/50 backdrop-blur-sm transition-all hover:scale-105">
    <div className={`text-2xl ${color}`}>
      {icon}
    </div>
    <div className="mt-2 text-lg font-semibold">{value}</div>
    <div className="text-xs text-gray-600">{title}</div>
  </div>
);

const SessionMetrics: React.FC<SessionMetricsProps> = ({ metrics }) => {
  const metricConfigs: MetricDialProps[] = [
    {
      title: "Time Spent",
      value: metrics.timeSpent,
      icon: <Clock className="animate-pulse-gentle" />,
      color: "text-blue-500"
    },
    {
      title: "Total Messages",
      value: metrics.totalMessages,
      icon: <MessageSquare />,
      color: "text-purple-500"
    },
    {
      title: "Your Messages",
      value: metrics.userMessages,
      icon: <User />,
      color: "text-green-500"
    },
    {
      title: "AI Responses",
      value: metrics.assistantMessages,
      icon: <Bot />,
      color: "text-amber-500"
    }
  ];

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-primary/20">
      <CardHeader>
        <CardTitle className="text-base text-primary">Your Session</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {metricConfigs.map((metric, index) => (
            <MetricDial key={index} {...metric} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SessionMetrics;