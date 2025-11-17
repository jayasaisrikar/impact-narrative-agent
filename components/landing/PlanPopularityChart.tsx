import React from 'react';
import { LineChart, Line, XAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CHART_DATA } from '../../constants/landingPageConstants';

export const PlanPopularityChart: React.FC = () => {
  return (
    <div className="bg-white/5 rounded-lg border border-white/10 p-4 h-64">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">Plan Popularity</h3>
        <p className="text-xs text-white/50">Monthly trend of users adopting this plan</p>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={CHART_DATA} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="month" stroke="rgba(255,255,255,0.4)" style={{ fontSize: '12px' }} />
          <Tooltip 
            contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px' }}
            labelStyle={{ color: 'rgba(255,255,255,0.8)' }}
          />
          <Line 
            type="monotone" 
            dataKey="interest" 
            stroke="url(#colorGradient)" 
            strokeWidth={3}
            dot={false}
            isAnimationActive={true}
          />
          <defs>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#818cf8" stopOpacity={1}/>
              <stop offset="95%" stopColor="#f472b6" stopOpacity={1}/>
            </linearGradient>
          </defs>
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
