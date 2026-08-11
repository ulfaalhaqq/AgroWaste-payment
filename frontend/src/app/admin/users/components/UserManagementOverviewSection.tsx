"use client";

import React, { useMemo, useState } from "react";
import icon7 from "./icons/totaluser.svg";
import icon8 from "../../components/icons/trendup.svg";
import icon9 from "./icons/activeseller.svg";
import icon10 from "../../components/icons/trendup.svg";
import icon11 from "./icons/activekurir.svg";
import icon12 from "../../components/icons/trenddown.svg";
import icon13 from "./icons/filters.svg";
import icon14 from "./icons/export.svg";
import icon15 from "./icons/menu.svg";
import icon16 from "./icons/menu.svg";
import icon17 from "./icons/menu.svg";
import icon18 from "../../components/icons/systemalert.svg";
import icon19 from "./icons/menu.svg";
import icon20 from "./icons/paginationleft.svg";
import icon21 from "./icons/paginationright.svg";

type FilterKey = "all" | "peternak" | "pembeli" | "kurir";

type IconSrc = string | { src: string };

type MetricCard = {
  title: string;
  value: string;
  change: string;
  changeColorClass: string;
  iconBgClass: string;
  iconSrc: IconSrc;
  trendIconSrc: IconSrc;
  iconClassName: string;
};

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: "Peternak" | "Pembeli" | "Kurir";
  roleBgClass: string;
  roleTextClass: string;
  status: "Active" | "Pending" | "Suspended";
  statusDotClass: string;
  statusTextClass: string;
  joinedDate: string;
  menuIcon: IconSrc;
  avatarType: "image" | "icon";
  avatarBgClass: string;
  avatarImageClassName?: string;
  avatarIconSrc?: IconSrc;
  nameTextClass?: string;
};

const metricCards: MetricCard[] = [
  {
    title: "TOTAL USERS",
    value: "24,592",
    change: "+12%",
    changeColorClass: "text-green-500",
    iconBgClass: "bg-[#a855f71a]",
    iconSrc: icon7,
    trendIconSrc: icon8,
    iconClassName: "relative w-[22px] h-4",
  },
  {
    title: "ACTIVE SELLERS (PETERNAK)",
    value: "1,840",
    change: "+5.2%",
    changeColorClass: "text-green-500",
    iconBgClass: "bg-[#16a34a1a]",
    iconSrc: icon9,
    trendIconSrc: icon10,
    iconClassName: "relative w-[22px] h-[17.2px]",
  },
  {
    title: "ACTIVE KURIRS (LOGISTIK)",
    value: "426",
    change: "-2.1%",
    changeColorClass: "text-red-500",
    iconBgClass: "bg-[#f59e0b1a]",
    iconSrc: icon11,
    trendIconSrc: icon12,
    iconClassName: "relative w-[22px] h-4",
  },
];

const filters: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All Users" },
  { key: "peternak", label: "Peternak" },
  { key: "pembeli", label: "Pembeli" },
  { key: "kurir", label: "Kurir" },
];

const users: UserRow[] = [
  {
    id: "1",
    name: "Bambang Sutejo",
    email: "bambang.s@agrow.id",
    role: "Peternak",
    roleBgClass: "bg-[#16a34a1a]",
    roleTextClass: "text-green-600",
    status: "Active",
    statusDotClass: "bg-green-500",
    statusTextClass: "text-[#1e1b19]",
    joinedDate: "12 Oct 2023",
    menuIcon: icon15,
    avatarType: "image",
    avatarBgClass: "bg-[#16a34a1a]",
    avatarImageClassName:
      "relative flex-1 self-stretch grow bg-[url(/bambang.png)] bg-cover bg-[50%_50%]",
  },
  {
    id: "2",
    name: "Anisa Putri",
    email: "anisa.p@market.com",
    role: "Pembeli",
    roleBgClass: "bg-[#3b82f61a]",
    roleTextClass: "text-blue-500",
    status: "Pending",
    statusDotClass: "bg-amber-400",
    statusTextClass: "text-[#1e1b19]",
    joinedDate: "05 Nov 2023",
    menuIcon: icon16,
    avatarType: "image",
    avatarBgClass: "bg-[#3b82f61a]",
    avatarImageClassName:
      "relative flex-1 self-stretch grow bg-[url(/anisa.png)] bg-cover bg-[50%_50%]",
  },
  {
    id: "3",
    name: "Rudi Hermawan",
    email: "rudi.logistics@mail.id",
    role: "Kurir",
    roleBgClass: "bg-[#f59e0b1a]",
    roleTextClass: "text-amber-500",
    status: "Active",
    statusDotClass: "bg-green-500",
    statusTextClass: "text-[#1e1b19]",
    joinedDate: "28 Oct 2023",
    menuIcon: icon17,
    avatarType: "image",
    avatarBgClass: "bg-[#f59e0b1a]",
    avatarImageClassName:
      "relative flex-1 self-stretch grow bg-[url(/rudi.png)] bg-cover bg-[50%_50%]",
  },
  {
    id: "4",
    name: "Suspected Bot_99",
    email: "unknown@spam.org",
    role: "Pembeli",
    roleBgClass: "bg-[#e9e1dd]",
    roleTextClass: "text-[#6e7b6c]",
    status: "Suspended",
    statusDotClass: "bg-red-500",
    statusTextClass: "text-red-500",
    joinedDate: "15 Nov 2023",
    menuIcon: icon19,
    avatarType: "icon",
    avatarBgClass: "bg-[#ef44441a]",
    avatarIconSrc: icon18,
    nameTextClass: "text-red-500",
  },
];

const paginationItems = [
  { type: "page", value: "1", active: true },
  { type: "page", value: "2", active: false },
  { type: "page", value: "3", active: false },
  { type: "ellipsis", value: "..." },
] as const;

export const UserManagementOverviewSection = (): React.ReactElement => {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

  const filteredUsers = useMemo(() => {
    if (activeFilter === "all") {
      return users;
    }

    const roleMap: Record<Exclude<FilterKey, "all">, UserRow["role"]> = {
      peternak: "Peternak",
      pembeli: "Pembeli",
      kurir: "Kurir",
    };

    return users.filter((user) => user.role === roleMap[activeFilter]);
  }, [activeFilter]);

  return (
    <section
      className="flex flex-col w-full items-start gap-8 p-8 relative"
      aria-label="User management overview"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {metricCards.map((card, index) => (
          <article
            key={card.title}
            className="w-full h-fit flex flex-col items-start gap-1 p-6 bg-white rounded-xl border border-solid border-[#bdcaba] shadow-[0px_1px_2px_#0000000d]"
          >
            <div className="flex items-start justify-between self-stretch w-full relative flex-[0_0_auto]">
              <div
                className={`inline-flex flex-col items-start p-3 relative flex-[0_0_auto] ${card.iconBgClass} rounded-lg`}
              >
                <img
                  className={card.iconClassName}
                  alt=""
                  src={
                    (card.iconSrc as { src?: string })?.src ??
                    (card.iconSrc as string)
                  }
                  aria-hidden="true"
                />
              </div>
              <div
                className={`inline-flex items-center ${index === 0 ? "gap-[3.99px]" : "gap-1"} relative flex-[0_0_auto]`}
              >
                <div
                  className={`mt-[-1.00px] [font-family:JetBrains_Mono,monospace] font-medium ${card.changeColorClass} text-sm tracking-[0] leading-5 whitespace-nowrap relative flex items-center w-fit`}
                >
                  {card.change}
                </div>
                <div className="inline-flex flex-col items-start relative flex-[0_0_auto]">
                  <img
                    className="relative w-[11.67px] h-[7px]"
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
              <div className="relative flex items-center self-stretch mt-[-1.00px] font-semibold text-[#6e7b6c] text-xs tracking-[0.60px] leading-4">
                {card.title}
              </div>
            </div>
            <div className="flex flex-col items-start self-stretch w-full relative flex-[0_0_auto]">
              <div className="relative flex items-center self-stretch mt-[-1.00px] [font-family:JetBrains_Mono,monospace] font-bold text-[#1e1b19] text-[32px] tracking-[0] leading-10">
                {card.value}
              </div>
            </div>
          </article>
        ))}
      </div>
      <div className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto] bg-white rounded-xl overflow-hidden border border-solid border-[#bdcaba] shadow-[0px_1px_2px_#0000000d]">
        <div className="flex items-center justify-between p-6 relative self-stretch w-full flex-[0_0_auto] border-b [border-bottom-style:solid] border-[#bdcaba]">
          <div
            className="inline-flex items-start gap-2 p-1 relative flex-[0_0_auto] bg-[#f4ece8] rounded-lg"
            role="tablist"
            aria-label="User role filters"
          >
            {filters.map((filter) => {
              const isActive = activeFilter === filter.key;

              return (
                <button
                  key={filter.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls="user-management-table"
                  className={
                    isActive
                      ? "inline-flex flex-col justify-center px-4 py-1.5 flex-[0_0_auto] bg-white rounded-md shadow-[0px_1px_2px_#0000000d] items-center relative"
                      : "inline-flex flex-col items-center justify-center px-4 py-1.5 relative flex-[0_0_auto]"
                  }
                  onClick={() => setActiveFilter(filter.key)}
                >
                  <div
                    className={
                      isActive
                        ? "justify-center mt-[-1.00px] font-semibold text-purple-500 text-xs text-center tracking-[0.60px] leading-4 whitespace-nowrap relative flex items-center w-fit"
                        : "justify-center mt-[-1.00px] font-semibold text-[#3e4a3d] text-xs text-center tracking-[0.60px] leading-4 whitespace-nowrap relative flex items-center w-fit"
                    }
                  >
                    {filter.label}
                  </div>
                </button>
              );
            })}
          </div>
          {/* More Filters & Export CSV hidden */}
        </div>
        <div
          id="user-management-table"
          className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto] overflow-x-auto overflow-y-hidden"
          role="region"
          aria-label="Users table"
        >
          <div className="min-w-full">
            <div
              className="grid bg-[#faf2ee] border-b border-[#bdcaba] w-full items-center"
              style={{
                gridTemplateColumns:
                  "minmax(250px, 2.5fr) minmax(120px, 1.5fr) minmax(120px, 1.5fr) minmax(150px, 1.5fr) 80px",
              }}
            >
              <div className="px-6 py-4 font-semibold text-[#6e7b6c] text-xs">
                User Name
              </div>
              <div className="px-6 py-4 font-semibold text-[#6e7b6c] text-xs">
                Role
              </div>
              <div className="px-6 py-4 font-semibold text-[#6e7b6c] text-xs">
                Status
              </div>
              <div className="px-6 py-4 font-semibold text-[#6e7b6c] text-xs">
                Joined Date
              </div>
              <div className="px-6 py-4 font-semibold text-[#6e7b6c] text-xs text-right">
                Actions
              </div>
            </div>
            <div className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto] -mt-px">
              {filteredUsers.map((user, index) => (
                <div
                  key={user.id}
                  className={`grid w-full items-center ${
                    index !== 0 ? "-mt-px border-t border-[#bdcaba4c]" : ""
                  }`}
                  style={{
                    gridTemplateColumns:
                      "minmax(250px, 2.5fr) minmax(120px, 1.5fr) minmax(120px, 1.5fr) minmax(150px, 1.5fr) 80px",
                  }}
                >
                  <div className="flex items-center gap-3 px-6 py-4">
                    <div
                      className={`flex w-10 h-10 items-center justify-center relative ${user.avatarBgClass} rounded-full flex-shrink-0 ${
                        user.avatarType === "image" ? "overflow-hidden" : ""
                      }`}
                    >
                      {user.avatarType === "image" &&
                      user.avatarImageClassName ? (
                        <div className={user.avatarImageClassName} />
                      ) : (
                        <img
                          className="relative w-4 h-4"
                          alt=""
                          src={
                            (user.avatarIconSrc as { src?: string })?.src ??
                            (user.avatarIconSrc as string)
                          }
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div
                        className={`font-semibold ${user.nameTextClass ?? "text-[#1e1b19]"} text-base truncate`}
                      >
                        {user.name}
                      </div>
                      <div className="font-semibold text-[#6e7b6cb2] text-xs truncate">
                        {user.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center px-6 py-4">
                    <div
                      className={`inline-flex items-center justify-center px-3 py-1 ${user.roleBgClass} rounded-full`}
                    >
                      <div
                        className={`font-semibold ${user.roleTextClass} text-xs`}
                      >
                        {user.role}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-6 py-4">
                    <div
                      className={`w-2 h-2 ${user.statusDotClass} rounded-full flex-shrink-0`}
                    />
                    <div
                      className={`font-normal ${user.statusTextClass} text-base`}
                    >
                      {user.status}
                    </div>
                  </div>
                  <div className="flex items-center px-6 py-4">
                    <div className="[font-family:JetBrains_Mono,monospace] font-medium text-[#6e7b6c] text-sm">
                      {user.joinedDate}
                    </div>
                  </div>
                  <div className="flex items-center justify-end px-6 py-4">
                    {/* Action menu 3-dot hidden */}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between p-6 relative self-stretch w-full flex-[0_0_auto] border-t [border-top-style:solid] border-[#bdcaba]">
          <div className="inline-flex flex-col items-start relative flex-[0_0_auto]">
            <p className="relative flex items-center w-fit mt-[-1.00px] font-semibold text-[#6e7b6c] text-xs tracking-[0.60px] leading-4 whitespace-nowrap">
              Showing {filteredUsers.length} of 24,592 users
            </p>
          </div>
          {/* Pagination hidden */}
        </div>
      </div>
    </section>
  );
};
