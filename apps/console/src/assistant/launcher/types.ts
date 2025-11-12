import React from 'react';

export interface AssistantTool {
  id: string;
  name: string;
  description?: string;
  icon: React.ReactNode;
  component: React.ComponentType;
}
