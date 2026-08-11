"use client";

import React from "react";
import icon from "./icons/trendup.svg";
import icon2 from "./icons/trendup.svg";
import icon3 from "./icons/money.svg";
import icon4 from "./icons/trenddown.svg";
import icon5 from "./icons/impact.svg";
import icon6 from "./icons/trendup.svg";
import icon7 from "./icons/newlisting.svg";
import icon8 from "./icons/transaction.svg";
import icon9 from "./icons/logistic.svg";
import icon10 from "./icons/systemalert.svg";
import icon11 from "./icons/admininsight.svg";
import icon12 from "./icons/activelogs.svg";
import icon20 from "./icons/user.svg";
import image from "./icons/listing.svg";
import vector from "./icons/Vector.svg";

type IconSrc = string | { src: string };

type SummaryCard = {
  label: string;
  value: string;
  change: string;
  changeColor: string;
  iconBg: string;
  iconSrc: IconSrc;
  iconAlt: string;
  iconClassName: string;
  trendIconSrc: IconSrc;
  trendLabel: string;
};

type ActivityItem = {
  iconBg: string;
  iconSrc: IconSrc;
  iconAlt: string;
  iconClassName: string;
  time: string;
  content: React.ReactElement;
};

type StatusCard = {
  label: string;
  value: string;
  valueClassName: string;
  visual: React.ReactElement;
  className?: string;
};

const summaryCards: SummaryCard[] = [
  {
    label: "TOTAL USERS",
    value: "24,892",
    change: "+12%",
    changeColor: "text-green-500",
    iconBg: "bg-[#3b82f61a]",
    iconSrc: icon20,
    iconAlt: "Total users icon",
    iconClassName: "relative w-[22px] h-4",
    trendIconSrc: icon,
    trendLabel: "Increase of 12 percent",
  },
  {
    label: "ACTIVE LISTINGS",
    value: "1,402",
    change: "+5%",
    changeColor: "text-green-500",
    iconBg: "bg-[#16a34a1a]",
    iconSrc: image,
    iconAlt: "Active listings icon",
    iconClassName: "relative w-5 h-5",
    trendIconSrc: icon2,
    trendLabel: "Increase of 5 percent",
  },
  {
    label: "TOTAL TRANSACTIONS",
    value: "IDR 4.2B",
    change: "-2%",
    changeColor: "text-red-500",
    iconBg: "bg-[#f59e0b1a]",
    iconSrc: icon3,
    iconAlt: "Total transactions icon",
    iconClassName: "relative w-[22px] h-4",
    trendIconSrc: icon4,
    trendLabel: "Decrease of 2 percent",
  },
  {
    label: "TOTAL IMPACT (CO2EQ)",
    value: "842.5 Tons",
    change: "+18%",
    changeColor: "text-green-500",
    iconBg: "bg-[#006b2c1a]",
    iconSrc: icon5,
    iconAlt: "Total impact icon",
    iconClassName: "relative w-[17px] h-[16.99px]",
    trendIconSrc: icon6,
    trendLabel: "Increase of 18 percent",
  },
];

const months = [
  { label: "JAN", width: "w-[77.88px]" },
  { label: "FEB", width: "w-[77.89px]" },
  { label: "MAR", width: "w-[77.89px]" },
  { label: "APR", width: "w-[77.89px]" },
  { label: "MAY", width: "w-[77.89px]" },
  { label: "JUN", width: "w-[77.89px]" },
];

const percentages = ["100%", "75%", "50%", "25%", "0%"];

const activityItems: ActivityItem[] = [
  {
    iconBg: "bg-[#16a34a1a]",
    iconSrc: icon7,
    iconAlt: "Listing activity icon",
    iconClassName: "relative w-[11.67px] h-[11.67px]",
    time: "2 minutes ago",
    content: (
      <p className="relative w-fit mt-[-1.00px] font-normal text-[#1e1b19] text-base tracking-[0] leading-6">
        <span className="font-bold">Budi Santoso</span>
        <span className=""> added a</span>
        <span className="font-bold">
          <br />
        </span>
        <span className="">new listing: 500kg</span>
        <span className="font-bold">
          <br />
        </span>
        <span className="">Corn Waste</span>
      </p>
    ),
  },
  {
    iconBg: "bg-[#3b82f61a]",
    iconSrc: icon8,
    iconAlt: "Transaction activity icon",
    iconClassName: "relative w-[11.67px] h-[11.67px]",
    time: "1 hour ago",
    content: (
      <p className="relative w-fit mt-[-1.00px] font-normal text-[#1e1b19] text-base tracking-[0] leading-6">
        <span className="">Transaction completed for </span>
        <span className="font-bold">Order #AW-8821</span>
      </p>
    ),
  },
  {
    iconBg: "bg-[#f59e0b1a]",
    iconSrc: icon9,
    iconAlt: "Pickup activity icon",
    iconClassName: "relative w-[12.83px] h-[9.33px]",
    time: "3 hours ago",
    content: (
      <p className="relative w-fit mt-[-1.00px] font-normal text-[#1e1b19] text-base tracking-[0] leading-6">
        <span className="font-bold">
          Logistik Express
          <br />
        </span>
        <span className="">assigned to pick up</span>
        <span className="font-bold">
          <br />
        </span>
        <span className="">#AW-8825</span>
      </p>
    ),
  },
  {
    iconBg: "bg-[#ba1a1a1a]",
    iconSrc: icon10,
    iconAlt: "System alert activity icon",
    iconClassName: "relative w-[10.5px] h-[10.5px]",
    time: "5 hours ago",
    content: (
      <p className="relative w-fit mt-[-1.00px] font-normal text-[#1e1b19] text-base tracking-[0] leading-6">
        System alert: High
        <br />
        latency detected in
        <br />
        payment gateway
      </p>
    ),
  },
];

const statusCards: StatusCard[] = [
  {
    label: "DATABASE STATUS",
    value: "Healthy",
    valueClassName:
      "relative flex items-center w-fit mt-[-1.00px] font-semibold text-green-500 text-2xl tracking-[0] leading-8 whitespace-nowrap",
    visual: (
      <div className="flex w-12 h-12 items-center justify-center relative rounded-full border-4 border-solid border-[#22c55e33]">
        <div className="relative w-4 h-4 bg-green-500 rounded-full" />
      </div>
    ),
    className:
      "p-6 relative w-full h-[98px] flex items-center justify-between bg-white rounded-xl border border-solid border-[#bdcaba]",
  },
  {
    label: "SERVER LOAD",
    value: "24%",
    valueClassName:
      "relative flex items-center w-fit mt-[-1.00px] font-semibold text-[#1e1b19] text-2xl tracking-[0] leading-8 whitespace-nowrap",
    visual: (
      <div
        className="inline-flex h-8 items-end gap-1 relative flex-[0_0_auto]"
        aria-hidden="true"
      >
        <div className="relative w-2 h-2 bg-purple-500 rounded-sm" />
        <div className="relative w-2 h-4 bg-purple-500 rounded-sm" />
        <div className="relative w-2 h-3 bg-purple-500 rounded-sm" />
        <div className="relative w-2 h-6 bg-purple-500 rounded-sm" />
      </div>
    ),
    className:
      "p-6 relative w-full h-[98px] flex items-center justify-between bg-white rounded-xl border border-solid border-[#bdcaba]",
  },
  {
    label: "ACTIVE LOGS",
    value: "1.2k/hr",
    valueClassName:
      "relative flex items-center w-fit mt-[-1.00px] [font-family:JetBrains_Mono,monospace] font-bold text-[#1e1b19] text-2xl tracking-[0] leading-8 whitespace-nowrap",
    visual: (
      <div className="inline-flex flex-col items-start relative flex-[0_0_auto]">
        <img
          className="relative w-[30px] h-6"
          alt="Active logs icon"
          src={(icon12 as { src?: string })?.src ?? String(icon12)}
        />
      </div>
    ),
    className:
      "pl-6 pr-[24.01px] py-6 relative w-full h-[98px] flex items-center justify-between bg-white rounded-xl border border-solid border-[#bdcaba]",
  },
];

export const PlatformOverviewSection = (): React.ReactElement => {
  return (
    <section
      className="flex flex-col w-full items-start gap-8 p-8 relative z-0"
      aria-labelledby="platform-overview-heading"
    >
      <header className="flex flex-col items-start gap-2 relative self-stretch w-full flex-[0_0_auto] bg-transparent">
        <div className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto]">
          <h2
            id="platform-overview-heading"
            className="relative flex items-center self-stretch mt-[-1.00px] [font-family:Hanken_Grotesk,sans-serif] font-bold text-[#1e1b19] text-[32px] tracking-[0] leading-10"
          >
            Platform Overview
          </h2>
        </div>
        <div className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto]">
          <p className="relative flex items-center self-stretch mt-[-1.00px] font-normal text-[#3e4a3d] text-lg tracking-[0] leading-7">
            Performance metrics and platform activity for the last 30 days.
          </p>
        </div>
      </header>
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-2 pb-0 px-0"
        role="list"
        aria-label="Platform summary metrics"
      >
        {summaryCards.map((card) => (
          <article
            key={card.label}
            role="listitem"
            className="relative w-full h-fit flex flex-col items-start gap-1 p-6 bg-white rounded-xl border border-solid border-[#bdcaba]"
          >
            <div className="flex items-start justify-between relative self-stretch w-full flex-[0_0_auto]">
              <div
                className={`inline-flex flex-col items-start p-2 relative flex-[0_0_auto] ${card.iconBg} rounded-lg`}
              >
                <img
                  className={card.iconClassName}
                  alt={card.iconAlt}
                  src={
                    (card.iconSrc as { src?: string })?.src ??
                    (card.iconSrc as string)
                  }
                />
              </div>
              <div
                className="inline-flex items-center gap-[3.99px] relative flex-[0_0_auto]"
                aria-label={card.trendLabel}
              >
                <div
                  className={`relative flex items-center w-fit mt-[-1.00px] [font-family:JetBrains_Mono,monospace] font-medium text-sm tracking-[0] leading-5 whitespace-nowrap ${card.changeColor}`}
                >
                  {card.change}
                </div>
                <div className="inline-flex flex-col items-start relative flex-[0_0_auto]">
                  <img
                    className="relative w-2.5 h-1.5"
                    alt=""
                    src={
                      (card.trendIconSrc as { src?: string })?.src ??
                      (card.trendIconSrc as string)
                    }
                    aria-hidden="true"
                  />
                </div>
              </div>
            </div>
            <div className="flex pt-3 pb-0 px-0 self-stretch w-full flex-col items-start relative flex-[0_0_auto]">
              <div className="relative flex items-center self-stretch mt-[-1.00px] font-semibold text-[#3e4a3d] text-xs tracking-[0.60px] leading-4">
                {card.label}
              </div>
            </div>
            <div className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto]">
              <div className="relative flex items-center self-stretch mt-[-1.00px] [font-family:JetBrains_Mono,monospace] font-bold text-[#1e1b19] text-2xl tracking-[0] leading-8">
                {card.value}
              </div>
            </div>
          </article>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-2 pb-0 px-0">
        <section
          className="lg:col-span-2 w-full h-fit flex flex-col items-start gap-6 p-8 bg-white rounded-xl border border-solid border-[#bdcaba]"
          aria-labelledby="platform-growth-heading"
        >
          <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
            <div className="inline-flex flex-col items-start relative flex-[0_0_auto]">
              <h3
                id="platform-growth-heading"
                className="relative flex items-center w-fit mt-[-1.00px] [font-family:Hanken_Grotesk,sans-serif] font-semibold text-[#1e1b19] text-2xl tracking-[0] leading-8 whitespace-nowrap"
              >
                Platform Growth
              </h3>
              <p className="relative flex items-center w-fit mt-[-1.00px] font-normal text-[#3e4a3d] text-base tracking-[0] leading-6 whitespace-nowrap">
                User onboarding vs supply growth
              </p>
            </div>
            {/* Last 6 Months filter hidden */}
          </div>

          {/* Chart area */}
          <div
            className="relative h-64 w-full"
            role="img"
            aria-label="Platform growth chart, January to June, 0 to 100 percent scale"
          >
            {/* Y-axis labels */}
            <div
              className="absolute left-0 top-0 bottom-8 flex flex-col justify-between"
              aria-hidden="true"
            >
              {percentages.map((value) => (
                <span
                  key={value}
                  className="font-semibold text-[#1e1b19] text-[10px] tracking-[0.60px] leading-4 opacity-30"
                >
                  {value}
                </span>
              ))}
            </div>

            {/* SVG line chart */}
            <div className="absolute inset-x-8 top-0 bottom-8">
              <svg
                className="w-full h-full text-purple-500"
                viewBox="0 0 400 150"
                fill="none"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient
                    id="purple-grad"
                    x1="0%"
                    y1="0%"
                    x2="0%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#A855F7" />
                    <stop offset="100%" stopColor="#A855F7" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,120 Q50,60 100,90 T200,40 T300,70 T400,20"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path
                  d="M0,120 Q50,60 100,90 T200,40 T300,70 T400,20 L400,150 L0,150 Z"
                  fill="url(#purple-grad)"
                  opacity="0.08"
                />
              </svg>
            </div>

            {/* X-axis labels */}
            <div
              className="absolute bottom-0 left-8 right-0 flex justify-between"
              aria-hidden="true"
            >
              {months.map((month) => (
                <span
                  key={month.label}
                  className="font-semibold text-[#3e4a3d] text-[10px] tracking-[0.60px] leading-4"
                >
                  {month.label}
                </span>
              ))}
            </div>
          </div>
        </section>

        <aside
          className="w-full h-fit flex flex-col items-start gap-8 p-8 bg-white rounded-xl border border-solid border-[#bdcaba]"
          aria-labelledby="recent-activity-heading"
        >
          <div className="flex items-center justify-between pl-0 pr-[0.01px] py-0 relative self-stretch w-full flex-[0_0_auto]">
            <div className="inline-flex flex-col items-start relative flex-[0_0_auto]">
              <h3
                id="recent-activity-heading"
                className="relative flex items-center w-fit mt-[-1.00px] [font-family:Hanken_Grotesk,sans-serif] font-semibold text-[#1e1b19] text-2xl tracking-[0] leading-8 whitespace-nowrap"
              >
                Recent Activity
              </h3>
            </div>
            {/* View All hidden */}
          </div>
          <ol className="flex flex-col items-start gap-6 relative self-stretch w-full flex-[0_0_auto] list-none m-0 p-0">
            {activityItems.map((item, index) => (
              <li
                key={`${item.time}-${index}`}
                className="flex items-start gap-4 relative self-stretch w-full flex-[0_0_auto]"
              >
                <div
                  className={`flex w-10 h-10 items-center justify-center relative ${item.iconBg} rounded-full`}
                >
                  <div className="inline-flex flex-col items-start relative flex-[0_0_auto]">
                    <img
                      className={item.iconClassName}
                      alt={item.iconAlt}
                      src={
                        (item.iconSrc as { src?: string })?.src ??
                        (item.iconSrc as string)
                      }
                    />
                  </div>
                </div>
                <div className="inline-flex flex-col items-start relative self-stretch flex-[0_0_auto]">
                  {item.content}
                  <div className="relative flex items-center w-fit mt-[-0.5px] opacity-60 font-semibold text-[#3e4a3d] text-xs tracking-[0.60px] leading-4 whitespace-nowrap">
                    {item.time}
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <div className="flex flex-col items-start pt-6 pb-0 px-0 relative self-stretch w-full flex-[0_0_auto] border-t [border-top-style:solid] border-[#bdcaba]">
            <section
              className="flex flex-col items-start gap-2 p-4 relative self-stretch w-full flex-[0_0_auto] bg-[#f4ece8] rounded-lg border border-solid border-[#bdcaba4c]"
              aria-labelledby="admin-insights-heading"
            >
              <div className="flex items-center gap-[11.99px] relative self-stretch w-full flex-[0_0_auto]">
                <div className="inline-flex flex-col items-start relative flex-[0_0_auto]">
                  <img
                    className="relative w-[22px] h-[22px]"
                    alt="Admin insights icon"
                    src={(icon11 as { src?: string })?.src ?? String(icon11)}
                  />
                </div>
                <div className="inline-flex flex-col items-start relative flex-[0_0_auto]">
                  <h4
                    id="admin-insights-heading"
                    className="relative flex items-center w-fit mt-[-1.00px] font-bold text-[#1e1b19] text-xs tracking-[0.60px] leading-4 whitespace-nowrap"
                  >
                    Admin Insights
                  </h4>
                </div>
              </div>
              <div className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto]">
                <p className="relative self-stretch mt-[-1.00px] [font-family:JetBrains_Mono,monospace] font-medium italic text-[#3e4a3dcc] text-sm tracking-[0] leading-5">
                  &#34;Listing approvals are
                  <br />
                  15% slower this week.
                  <br />
                  Consider assigning
                  <br />
                  more moderators to the
                  <br />
                  &#39;Peternak&#39; queue.&#34;
                </p>
              </div>
            </section>
          </div>
        </aside>
      </div>
      <div
        className="grid grid-cols-1 sm:grid-cols-3 gap-8"
        role="list"
        aria-label="Platform system status"
      >
        {statusCards.map((card) => (
          <article key={card.label} role="listitem" className={card.className}>
            <div className="inline-flex flex-col items-start relative flex-[0_0_auto]">
              <div className="flex self-stretch w-full flex-col items-start relative flex-[0_0_auto]">
                <div className="relative flex items-center w-fit mt-[-1.00px] font-semibold text-[#3e4a3d] text-xs tracking-[0.60px] leading-4 whitespace-nowrap">
                  {card.label}
                </div>
              </div>
              <div className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto]">
                <div className={card.valueClassName}>{card.value}</div>
              </div>
            </div>
            {card.visual}
          </article>
        ))}
      </div>
    </section>
  );
};
