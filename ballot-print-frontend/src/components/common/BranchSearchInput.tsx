import React, { useState, useEffect } from "react";
import { Autocomplete, AutocompleteItem, InputProps } from "@heroui/react";
import Cookies from "js-cookie";
import { Branch, SearchBranchQuery } from "@/lib/store/common/types";
import { useSearchBranch } from "@/lib/hooks/useSearchBranch";

const inputProps: Pick<InputProps, "labelPlacement" | "classNames"> = {
    labelPlacement: "outside",
    classNames: {
        label:
            "text-small font-medium text-default-700 group-data-[filled-within=true]:text-default-700",
    },
};

export interface BranchSearchInputProps {
    selectedBranch: Branch;
    onBranchSelectionChange: (branch: Branch) => void;
    handleOnClear?: () => void;
    label: string;
    placeholder: string;
    isRequired?: boolean;
}

export default function BranchSearchInput({
    selectedBranch,
    label,
    placeholder,
    isRequired,
    onBranchSelectionChange,
    handleOnClear
}: BranchSearchInputProps) {
    const access = Cookies.get("access") || "";
    const [searchedInput, setSearchedInput] = useState<string>(selectedBranch.name);

    const [searchBranchQueryParams, setSearchBranchQueryParams] = useState<SearchBranchQuery>({
        branch_query: "",
        page: 1,
        per_page: 100,
        status: "EDBO,EDSO,GPO,HO,SO,TSO,UPO",
    });


    const { data, isLoading, isError, error, refetch } = useSearchBranch(
        access,
        searchBranchQueryParams
    );

    useEffect(() => {
        setSearchBranchQueryParams((prev: SearchBranchQuery) => ({
            ...prev,
            branch_query: searchedInput,
        }));
    }, [searchedInput]);

    useEffect(() => {
        console.log("selectedBranch changed:", selectedBranch);
        if (selectedBranch.name) {
            setSearchedInput(selectedBranch.name);
        } else {
            setSearchedInput("");
        }
    }, [selectedBranch.branch_code]);

    useEffect(() => {
        if (searchBranchQueryParams.branch_query !== "") {
            refetch();
        }
    }, [searchBranchQueryParams]);
    const handleBranchSelectionChange = (selectedKey: React.Key | null) => {
        // console.log("selectedKey", selectedKey);
        if (data && data.data && data.data.length !== 0 && selectedKey) {
            // console.log("selectedKey", selectedKey);
            const selectedBranch: Branch | undefined = data?.data.find((branch: Branch) => branch.branch_code === selectedKey);
            if (selectedBranch) {
                console.log("selectedBranch", selectedBranch);
                onBranchSelectionChange(selectedBranch);
                setSearchedInput(selectedBranch.name);
            }
        }

    }
    return (
        <Autocomplete
            isRequired={isRequired}
            labelPlacement="outside"
            inputProps={{
                classNames: inputProps.classNames,
            }}
            variant="bordered"
            radius="sm"
            size="lg"
            isClearable
            className="text-postDark"
            clearButtonProps={{
                onClick: () => {
                    setSearchedInput("");
                    if (handleOnClear) {
                        handleOnClear();
                    }
                },
            }}
            // label={label}
            aria-label={label}
            placeholder={placeholder}
            inputValue={searchedInput}
            selectedKey={selectedBranch.branch_code}
            items={data?.data || []}
            isLoading={isLoading}
            onInputChange={setSearchedInput}
            onSelectionChange={handleBranchSelectionChange}
        // onClear={handleOnClear}
        >
            {(item: Branch) => (
                <AutocompleteItem key={item.branch_code} textValue={item.name}>
                    <p className="text-postDark dark:text-postLight">{item.name} ({item.branch_code}) {item.upzilla.length && item.upzilla != '0' ? `, ${item.upzilla}` : ''} {item.district.length && item.district != '0' ? `, ${item.district}` : ''}</p>
                </AutocompleteItem>
            )}
        </Autocomplete>
    );
}
