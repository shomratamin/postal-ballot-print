"use client";

import type { FC } from "react";

import {
  type ButtonProps,
  Card,
  CardBody,
  type Selection,
  Badge,
  Tooltip,
  Avatar,
} from "@heroui/react";
import { Command } from "cmdk";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { matchSorter } from "match-sorter";
import {
  Button,
  Kbd,
  Listbox,
  ListboxItem,
  ScrollShadow,
  cn,
} from "@heroui/react";
import { tv } from "tailwind-variants";
import MultiRef from "react-multi-ref";
import scrollIntoView from "scroll-into-view-if-needed";
import { isAppleDevice, isWebKit } from "@react-aria/utils";
import { capitalize, divide, intersectionBy, isEmpty } from "lodash";
import { useLocalStorage, useMediaQuery } from "usehooks-ts";
import { Icon } from "@iconify/react";
// import xIcon from "@iconify/icons-lucide/x";
// import magnifierIcon from "@iconify/icons-solar/magnifer-linear";
// import arrowRightIcon from "@iconify/icons-solar/alt-arrow-right-line-duotone";
import Image from "next/image";

import { useUpdateEffect } from "./use-update-effect";
import { CategoryEnum, type SearchResultItem } from "./data";

import { searchData } from "./mock-data";
import { Locale } from "@/dictionaries/dictionaty";
import { CommonLocale, LoginLocale, ServiceLocale } from "@/dictionaries/types";
import { Country, CountryMap, Zone } from "@/lib/store/address/types";

const cmdk = tv({
  slots: {
    base: "max-h-full h-auto",
    header: [
      "flex",
      "items-center",
      "w-full",
      "px-4",
      "border-b",
      "border-default-400/50",
      "dark:border-default-100",
    ],
    searchIcon: "text-default-400 text-lg [&>g]:stroke-[2px]",
    input: [
      "w-full",
      "px-2",
      "py-2",
      "font-sans",
      "text-lg",
      "outline-none",
      "rounded-none",
      "bg-transparent",
      "text-default-700",
      "placeholder-default-500",
      "dark:text-default-500",
      "dark:placeholder:text-default-300",
    ],
    listScroll: ["pt-2", "pr-4", "pb-6", "overflow-y-auto"],
    list: ["max-h-[50vh] sm:max-h-[40vh]"],
    listWrapper: ["flex", "flex-col", "gap-4", "pb-4"],
    itemWrapper: [
      "px-4",
      "mt-2",
      "group",
      "flex",
      "h-[54px]",
      "justify-between",
      "items-center",
      "rounded-lg",
      "shadow",
      "bg-content2/50",
      "active:opacity-70",
      "cursor-pointer",
      "transition-opacity",
      "data-[active=true]:bg-primary",
      "data-[active=true]:text-primary-foreground",
    ],
    leftWrapper: ["flex", "gap-3", "items-center", "w-full", "max-w-full"],
    leftWrapperOnMobile: [
      "flex",
      "gap-3",
      "items-center",
      "w-full",
      "max-w-[166px]",
    ],
    rightWrapper: ["flex", "flex-row", "gap-2", "items-center"],
    leftIcon: [
      "text-default-500 dark:text-default-300",
      "group-data-[active=true]:text-primary-foreground",
    ],
    itemContent: ["flex", "flex-col", "gap-0", "justify-center", "max-w-[80%]"],
    itemParentTitle: [
      "text-default-400",
      "text-xs",
      "group-data-[active=true]:text-primary-foreground",
      "select-none",
    ],
    itemTitle: [
      "truncate",
      "text-default-500",
      "group-data-[active=true]:text-primary-foreground",
      "select-none",
    ],
    emptyWrapper: [
      "flex",
      "flex-col",
      "text-center",
      "items-center",
      "justify-center",
      "h-32",
    ],
    sectionTitle: ["text-xs", "font-semibold", "leading-4", "text-default-900"],
    categoryItem: [
      "h-[50px]",
      "gap-3",
      "py-2",
      "bg-default-100/50",
      "text-medium",
      "text-default-500",
      "data-[hover=true]:bg-default-400/40",
      "data-[selected=true]:bg-default-400/40",
      "data-[selected=true]:text-white",
      "data-[selected=true]:focus:bg-default-400/40",
    ],
    groupItem: [
      "flex-none",
      "aspect-square",
      "rounded-large",
      "overflow-hidden",
      "cursor-pointer",
      "border-small",
      "h-[120px]",
      "w-[120px]",
      "border-white/10",
      "bg-black/20",
      "data-[active=true]:bg-white/[.05]",
      "data-[active=true]:text-primary-foreground",
    ],
  },
});

const RECENT_SEARCHES_KEY = "recent-searches--heroui-pro";
const MAX_RECENT_SEARCHES = 10;

function flattenSearchData(
  countries: Country[],
  zones: Zone[],
  lang: Locale
): SearchResultItem[] {
  let flattened: SearchResultItem[] = [];

  countries.forEach((country) => {
    let zone = zones.find((z) => z.id === country.zone_id);
    if (!zone) return;

    let zoneName = lang === "en" ? zone.name : zone.bn_name;
    let countryName = lang === "en" ? country.name : country.bn_name;

    flattened.push({
      slug: countryName, // Country slug
      category: zone.id.toString(), // Use zone ID as category
      group: {
        key: zone.id.toString(), // Group key is the zone ID
        name: zoneName, // Group name is the zone name
      },
      image: `https://flagcdn.com/${country.code.toLowerCase()}.svg`,
      component: {
        id: `${country.id}`,
        name: country.name,
        slug: country.name,
        bn_name: country.bn_name,
        image: "", // You can add flag icons here if needed
        attributes: {
          group: zoneName, // Group name (zone name)
          sortPriority: "medium",
        },
      },
      url: `/countries/${country.name}`,
      content: lang == "en" ? country.name : country.bn_name,
    });
  });

  return flattened;
}

function groupedSearchData(
  data: SearchResultItem[],
  zones: Zone[]
): { [key: string]: SearchResultItem[] } {
  let categoryGroupMap: { [key: string]: SearchResultItem[] } = {};

  // Initialize categories based on zones
  zones.forEach((zone) => {
    categoryGroupMap[zone.id.toString()] = [];
  });

  // Group countries under their respective zones
  data.forEach((item) => {
    if (item.category && categoryGroupMap[item.category]) {
      categoryGroupMap[item.category].push(item);
    }
  });

  return categoryGroupMap;
}

/**
 *  🚨 Important
 *
 *  This component requires installing the following packages:
 * `npm install cmdk usehooks-ts lodash tailwind-variants @radix-ui/react-popover
 *  scroll-into-view-if-needed react-multi-ref match-sorter`
 *
 */

export interface SearchCountryComponentProps {
  lang: Locale;
  serviceLocale: ServiceLocale;
  commonLocale: CommonLocale;
  countries: Country[];
  countryMap: CountryMap;
  zones: Zone[];
  selectedCountry?: Country | null; // 👈 make it optional / nullable
  selectedZone?: Zone | null;
  error?: string;
  setError?: (error: boolean) => void;
  onCountryChange: (country: Country | null) => void;
}
const SearchCountryComponent: FC<SearchCountryComponentProps> = ({
  lang,
  serviceLocale,
  commonLocale,
  countries,
  countryMap,
  zones,
  selectedCountry,
  selectedZone,
  error,
  setError,
  onCountryChange,
}) => {
  const [query, setQuery] = useState("");


  useEffect(() => {
    if (selectedCountry) {
      setQuery(lang === "en" ? selectedCountry.name : selectedCountry.bn_name);
    } else {
      setQuery(""); // when you clear selection from parent
    }
  }, [selectedCountry, lang]);

  const [activeItem, setActiveItem] = useState(0);
  const [menuNodes] = useState(() => new MultiRef<number, HTMLElement>());
  const [selectedCategory, setSelectedCategory] = useState<string>(
    zones[0]?.id.toString() || "1"
  );
  const slots = useMemo(() => cmdk(), []);
  // const flattenedData = useMemo(() => flattenSearchData(), []);
  // const groupedData = useMemo(() => groupedSearchData(flattenedData), [flattenedData]);
  const flattenedData = useMemo(
    () => flattenSearchData(countries, zones, lang),
    [countries, zones, lang]
  );
  const groupedData = useMemo(
    () => groupedSearchData(flattenedData, zones),
    [flattenedData, zones]
  );
  const eventRef = useRef<"mouse" | "keyboard">();
  const listRef = useRef<HTMLDivElement>(null);
  const [commandKey, setCommandKey] = useState<"ctrl" | "command">("command");
  const [inputFocused, setInputFocused] = useState(false);
  const CATEGORY_ICON_MAP: Record<string, string> = {
    "1": "solar:earth-linear", // SAARC
    "2": "solar:earth-2-linear", // Other Asian Countries
    "3": "solar:island-linear", // Oceania
    "4": "solar:globe-2-linear", // Africa and Europe
    "5": "solar:flag-linear", // North and South America
  };

  const CATEGORIES = zones.map((zone: Zone) => ({
    key: zone.id.toString(),
    icon: CATEGORY_ICON_MAP[zone.id.toString()] || "solar:globe-3-linear",
    label: lang === "en" ? zone.name : zone.bn_name,
  }));

  useEffect(() => {
    console.log("Selected country: ", selectedCountry);
    setCommandKey(isAppleDevice() ? "command" : "ctrl");
  }, []);

  const isMobile = useMediaQuery("(max-width: 650px)");

  const [savedRecentSearches, setRecentSearches] = useLocalStorage<
    SearchResultItem[]
  >(RECENT_SEARCHES_KEY, []);

  const recentSearches = useMemo(() => {
    if (isEmpty(savedRecentSearches)) return [];

    return savedRecentSearches?.map((item: SearchResultItem) => {
      const found = searchData[item.category as CategoryEnum]?.find(
        (i) => i.slug === item.slug
      ) as SearchResultItem;

      return {
        ...item,
        ...found,
      };
    });
  }, [savedRecentSearches]);

  const addToRecentSearches = useCallback(
    (item: SearchResultItem) => {
      let searches = recentSearches ?? [];

      // Avoid adding the same search again
      if (!searches.find((i) => i.slug === item.slug)) {
        setRecentSearches([item, ...searches].slice(0, MAX_RECENT_SEARCHES));
      } else {
        // Move the search to the top
        searches = searches.filter(
          (i: SearchResultItem) => i.slug !== item.slug
        );
        setRecentSearches([item, ...searches].slice(0, MAX_RECENT_SEARCHES));
      }
    },
    [recentSearches, setRecentSearches]
  );
  const isEnglishQuery = (query: string) => /^[A-Za-z0-9\s]+$/.test(query);
  const results = useMemo(() => {
    // console.log("Query from results: ", query);
    if (isEmpty(query)) return [];
    // Determine the correct search key based on language
    // const searchKey = lang === "en" ? "component.name" : "component.bn_name";
    const searchKey = isEnglishQuery(query)
      ? "component.name"
      : "component.bn_name";
    return matchSorter(flattenedData, query, {
      keys: [searchKey], // Dynamically search in the right field
      threshold: matchSorter.rankings.CONTAINS, // Improve fuzzy matching
    }).slice(0, 20);
  }, [query, flattenedData, lang]);

  const categoryGroups = useMemo(() => {
    let categoryGroups: { [key: string]: SearchResultItem[] } = {};
    const categorySearchItems = groupedData[selectedCategory] || [];
    categoryGroups[selectedCategory] = categorySearchItems;
    return categoryGroups;
  }, [groupedData, selectedCategory]);

  const flattenGroupedItems = useMemo(() => {
    let flatten = [] as SearchResultItem[];

    Object.values(categoryGroups).forEach((groupItems) => {
      flatten = [...flatten, ...groupItems];
    });

    return flatten;
  }, [categoryGroups]);

  const items = useMemo(
    () => (!isEmpty(results) ? results : recentSearches ?? []),
    [results, recentSearches]
  );

  // Toggle the menu when ⌘K / CTRL K is pressed
  // useEffect(() => {
  //     const onKeyDown = (e: KeyboardEvent) => {
  //         const hotkey = isAppleDevice() ? "metaKey" : "ctrlKey";

  //         if (e?.key?.toLowerCase() === "k" && e[hotkey]) {
  //             e.preventDefault();
  //             isOpen ? onClose() : onOpen();
  //         }
  //     };

  //     document.addEventListener("keydown", onKeyDown);

  //     return () => {
  //         document.removeEventListener("keydown", onKeyDown);
  //     };
  // }, [isOpen, onOpen, onClose]);

  const onItemSelect = (item: SearchResultItem) => {
    // console.log("country map", countryMap);
    setQuery(lang === "en" ? item.component.name : item.component.bn_name); // Set selected country name to search input
    // addToRecentSearches(item);
    setInputFocused(false);
    setSelectedCategory(item.category);
    console.log("Selected country: ", item);
    console.log("country map: ", countryMap);
    onCountryChange(countryMap[item.component.id]); // Trigger country change callback if needed
  };

  const onCategorySelect = useCallback((keys: Selection) => {
    const key = Array.from(keys)[0] as CategoryEnum;

    setSelectedCategory(key);
  }, []);

  const onInputKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      eventRef.current = "keyboard";
      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();

          if (activeItem + 1 < items.length + flattenGroupedItems.length) {
            setActiveItem(activeItem + 1);
          }
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          if (activeItem - 1 >= 0) {
            setActiveItem(activeItem - 1);
          }
          break;
        }
        case "Control":
        case "Alt":
        case "Shift": {
          e.preventDefault();
          break;
        }
        case "Enter": {
          if (items?.length <= 0) {
            break;
          }

          if (activeItem < items.length) {
            onItemSelect(items[activeItem]);
            break;
          } else if (
            isEmpty(query) &&
            flattenGroupedItems &&
            activeItem < items.length + flattenGroupedItems?.length
          ) {
            onItemSelect(flattenGroupedItems[activeItem]);
            break;
          }

          break;
        }
      }
    },
    [activeItem, flattenGroupedItems, items, onItemSelect, query]
  );

  useUpdateEffect(() => {
    setActiveItem(0);
  }, [query]);

  useUpdateEffect(() => {
    if (!listRef.current || eventRef.current === "mouse") return;
    const node = menuNodes.map.get(activeItem);

    if (!node) return;
    scrollIntoView(node, {
      scrollMode: "if-needed",
      behavior: "smooth",
      block: "end",
      inline: "end",
      boundary: listRef.current,
    });
  }, [activeItem]);

  const CloseButton = useCallback(
    ({
      onPress,
      className,
    }: {
      onPress?: ButtonProps["onPress"];
      className?: ButtonProps["className"];
    }) => {
      return (
        <Button
          isIconOnly
          className={cn(
            "border border-default-400 data-[hover=true]:bg-content2 dark:border-default-100",
            className
          )}
          radius="sm"
          size="sm"
          variant="bordered"
          onPress={onPress}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18 18 6M6 6l12 12"
            />
          </svg>
        </Button>
      );
    },
    []
  );

  // render search result items.
  const renderSearchItem = useCallback(
    (item: SearchResultItem, index: number, isRecent: boolean) => {
      const isActive = index === activeItem;
      const content = (
        <Command.Item
          key={item.slug}
          ref={menuNodes.ref(index)}
          className={slots.itemWrapper()}
          data-active={isActive}
          value={item.content}
          onMouseEnter={() => {
            eventRef.current = "mouse";
            setActiveItem(index);
          }}
          onMouseLeave={() => {
            if (isActive) {
              setActiveItem(-1);
            }
          }}
          onSelect={() => {
            if (eventRef.current === "keyboard") {
              return;
            }
            onItemSelect(item);
          }}
        >
          <div
            className={
              isMobile ? slots.leftWrapperOnMobile() : slots.leftWrapper()
            }
          >
            {item.category && (
              <Avatar alt="Country Flag" className="h-6 w-6" src={item.image} />
            )}
            <div className={slots.itemContent()}>
              <span className={slots.itemParentTitle()}>
                {/* {capitalize(item.category)}/{capitalize(item.group.name)} */}
              </span>
              <p className={slots.itemTitle()}>{item.content}</p>
            </div>
          </div>
        </Command.Item>
      );

      return content; // Ensure it returns JSX
    },
    [activeItem, menuNodes, slots, isMobile, onItemSelect]
  );

  const renderGroups = useCallback(
    (groups: { [key: string]: SearchResultItem[] }) => {
      // console.log("Groups: ", groups);
      return Object.keys(groups).map((key) => {
        const groupItems = groups[key]; // Countries under a zone
        const groupName = groupItems[0]?.group.name;

        return (
          <div key={key} className="flex flex-col">
            {/* Group Title */}
            <Command.Group
              heading={
                <p className="text-xs font-semibold leading-4 text-default-900">
                  {groupName}
                </p>
              }
            >
              {/* Scrollable List of Items */}
              {/* <div className="mt-2 flex flex-row flex-wrap gap-2 max-h-[300px] overflow-y-auto">
                                {groupItems.map((item, index) => renderSearchItem(item, index, false))}
                            </div> */}
              <div className="mt-2 grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
                {groupItems.map((item, index) =>
                  renderSearchItem(item, index, false)
                )}
              </div>
            </Command.Group>
          </div>
        );
      });
    },
    [renderSearchItem]
  );

  // render categories
  const renderCategories = useCallback(() => {
    return (
      <Listbox
        disallowEmptySelection
        hideSelectedIcon
        aria-label="Categories"
        classNames={{
          list: isMobile ? "flex flex-row gap-2" : "flex gap-2",
        }}
        selectedKeys={[selectedCategory]}
        selectionMode="single"
        variant="flat"
        onAction={alert}
        onSelectionChange={onCategorySelect}
      >
        {CATEGORIES.map((item) => (
          <ListboxItem
            key={item.key}
            className={slots.categoryItem()}
            // startContent={<Icon className="text-default-400" icon={item.icon} width={20} />}
            textValue={item.label}
          >
            <span className="flex">{item.label}</span>
          </ListboxItem>
        ))}
      </Listbox>
    );
  }, [isMobile, selectedCategory, onCategorySelect, slots]);

  const onInputFocus = () => {
    // console.log("Input focused");
    setInputFocused(true);
  };

  const onInputBlur = () => {
    // console.log("Input blurred");
    setTimeout(() => {
      if (query) {
        setInputFocused(false);
      }
    }, 200);
  };
  return (
    <>
      <Command
        className={slots.base()}
        label="Quick search command"
        shouldFilter={false}
      >
        <div className="flex items-center gap-2 rounded-md border-2 border-postLight dark:border-postBorderDark">
          <div className="pl-2 text-postDark dark:text-postLight">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
          </div>

          <Command.Input
            autoFocus={!isWebKit()}
            className={slots.input()}
            placeholder={serviceLocale.recipient_country}
            value={query}
            onKeyDown={onInputKeyDown}
            onValueChange={setQuery}
            onFocus={onInputFocus}
            onBlur={onInputBlur}
          />
          {(query.length > 0 || selectedCountry) && (
            <div className="pr-2 flex items-center gap-2">
              {selectedCountry && (
                <Avatar
                  alt="Country Flag"
                  className="h-6 w-6"
                  src={`https://flagcdn.com/${selectedCountry.code.toLowerCase()}.svg`}
                />
              )}
              <CloseButton
                onPress={() => {
                  setInputFocused(true);
                  setQuery("");
                  onCountryChange(null);
                  if (setError) {
                    setError(true);
                  }
                }}
              />
            </div>
          )}
          {/* <Kbd className="ml-2 hidden border-none px-2 py-1 text-[0.6rem] font-medium md:block">
                            ESC
                        </Kbd> */}
        </div>
        {error && error.length !== 0 && (
          <p className="text-postRed">{`${error}`}</p>
        )}
        {inputFocused && (
          <div className="relative grid grid-cols-12 gap-4">
            {/* Category (Web) */}
            {!isMobile && isEmpty(query) && (
              <div className="col-span-4 flex flex-col gap-2 border-r-1 border-white/10 px-4 py-2">
                <p className={slots.sectionTitle()}>{serviceLocale.zone}</p>
                {renderCategories()}
              </div>
            )}
            {/* Scrollable Items */}
            <div
              ref={listRef}
              className={cn(
                slots.listScroll(),
                { "col-span-8": !isMobile && isEmpty(query) },
                { "col-span-12 pl-4": isMobile || !isEmpty(query) }
              )}
            >
              <Command.List
                className={cn(slots.list(), "[&>div]:pb-4")}
                role="listbox"
              >
                {query.length > 0 && inputFocused && (
                  <Command.Empty>
                    <div className={slots.emptyWrapper()}>
                      <div>
                        <p>No results for &quot;{query}&quot;</p>
                        {query.length === 1 ? (
                          <p className="text-default-400">
                            Try adding more characters to your search term.
                          </p>
                        ) : (
                          <p className="text-default-400">
                            Try searching for something else.
                          </p>
                        )}
                      </div>
                    </div>
                  </Command.Empty>
                )}
                {isEmpty(query) && (
                  <div className={slots.listWrapper()}>
                    {/* Recent */}
                    {/* {!isEmpty(recentSearches) && recentSearches.length > 0 && (
                                            <Command.Group
                                                heading={
                                                    <div className="flex items-center justify-between">
                                                        <p className={slots.sectionTitle()}>Recent</p>
                                                    </div>
                                                }
                                            >
                                                <ScrollShadow hideScrollBar orientation="horizontal">
                                                    <div className="flex flex-row gap-2">
                                                        {recentSearches.map((item: SearchResultItem, index: number) =>
                                                            renderSearchItem(item, index, true),
                                                        )}
                                                    </div>
                                                </ScrollShadow>
                                            </Command.Group>
                                        )} */}
                    {/* Categories (Mobile) */}
                    {isMobile && (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <p className={slots.sectionTitle()}>
                            {serviceLocale.zone}
                          </p>
                        </div>
                        <ScrollShadow orientation="horizontal">
                          {renderCategories()}
                        </ScrollShadow>
                      </div>
                    )}
                    {/* Group */}
                    {renderGroups(categoryGroups)}
                  </div>
                )}
                {inputFocused
                  ? results.map((item, index) =>
                    renderSearchItem(item, index, false)
                  )
                  : ""}
              </Command.List>
            </div>
          </div>
        )}
      </Command>
    </>
  );
};

export default SearchCountryComponent;
