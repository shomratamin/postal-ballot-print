
import { Card, CardBody, CardFooter, CardHeader, Checkbox, Spinner } from '@heroui/react'
import React from 'react'
import Image from "next/image";
import { AddressType, Person } from '@/lib/store/person/types';
import Cookies from "js-cookie";

export default function AddressCard(props: { person: Person, isSelected: boolean, onUsePerson: any, onEditPerson: any }) {

    // let {
    //     mutate: deletePerson,
    //     isSuccess: isDeleted,
    //     isPending: isPending,
    // } = useDeletePerson(Cookies.get("access") || "", props.person.id);


    return (
        <Card
            className="flex flex-grow"
            classNames={{
                base: "rounded-md shadow-none border border-postLight"
            }}>
            <CardHeader className={`flex border-b border-pdfLight p-2 md:px-2 lg:px-4 ${props.isSelected && "bg-postGreenLight"}  rounded-t-md`}>
                <Checkbox color={props.isSelected ? "default" : "success"} onChange={(person) => props.onUsePerson(person)} isSelected={props.isSelected}></Checkbox>
                <div className='flex justify-end w-full'>

                    <div onClick={() => props.onEditPerson()} className='cursor-pointer'>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke={props.isSelected ? "#006A4E" : "#d4d4d8"} className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                        </svg>
                    </div>
                    {/* {isPending && <Spinner size="sm" color="success" />} */}
                    {/* <div onClick={() => {
                        deletePerson()
                        window.location.reload()
                    }} className='cursor-pointer'>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={props.isSelected ? "#006A4E" : "#d4d4d8"} className="size-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>

                    </div> */}
                </div>
            </CardHeader>

            <CardBody className="p-2 md:px-2 lg:px-4">
                {/* <p>{props.person.address_type}</p> */}
                <div className="flex justify-between">
                    <p className="text-lg font-bold">{props.person.name}</p>
                </div>
                <p style={{ whiteSpace: 'pre-line' }}>{props.person.address} </p>
                {props.person.address_type == AddressType["DOMESTIC"] ? <>
                    <p>{props.person.post_office}</p>
                    <p>{props.person.police_station}, {props.person.district}</p>
                </> : <>
                    <p>{props.person.country}</p>
                </>}


                <p>মোবাইল : {props.person.phone}</p>
            </CardBody>


        </Card>
    )
}
