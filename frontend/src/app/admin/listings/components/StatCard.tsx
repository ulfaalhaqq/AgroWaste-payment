import React from "react";

export interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  colorScheme: "amber" | "green" | "red";
}

const schemes = {
  amber: { arc: "bg-admin-semamber/10", value: "text-admin-semamber" },
  green: { arc: "bg-admin-semgreen/10", value: "text-admin-semgreen" },
  red: { arc: "bg-admin-semred/10", value: "text-admin-semred" },
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  description,
  colorScheme,
}) => {
  const { arc, value: valueColor } = schemes[colorScheme];

  return (
    <div className="bg-admin-surfacewhite border border-admin-hairline rounded-2xl p-6 relative overflow-hidden">
      {/* Subtle corner arc — no side-stripe */}
      <div
        className={`absolute right-0 top-0 w-24 h-24 rounded-bl-full -mr-4 -mt-4 ${arc}`}
        aria-hidden="true"
      />
      <span className="text-[10px] font-bold text-admin-textsecondary uppercase tracking-wider block mb-2">
        {title}
      </span>
      <div className={`text-3xl font-bold font-tabular ${valueColor}`}>
        {value}
      </div>
      <p className="text-xs text-admin-textsecondary mt-1">{description}</p>
    </div>
  );
};
