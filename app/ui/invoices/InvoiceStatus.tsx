'use client'
import { updateInvoiceStatus } from '@/app/lib/actions';
import { CheckIcon, ClockIcon,ChevronDownIcon} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { useSession } from 'next-auth/react';
import { useState } from 'react';

export default function InvoiceStatus({ status ,id  }: { status: string , id:string}) {
  const possiblstatus = ['pending', 'paid' , 'canceled']
  const [isDropdownopen,setIsdropdownopen] = useState(false)
  const [current , setCurrent] = useState(status)
  const { data: Session } = useSession()
  const userName = Session?.user?.name
  if (!userName){
    throw new Error('user not auth')
}
  const toggledropdown = () => {
    setIsdropdownopen(!isDropdownopen)
  }

  const handleStatuschange = async (newStatus:string)=>{
    try {
      const result = await updateInvoiceStatus(id, newStatus,userName)
      if ( result.message !== 'invalid status' || 'Database Error: Failed to Update Invoice.'){
        setCurrent(newStatus)
      }
    } catch (error) {
      console.error('fetch failed')
    }
    setIsdropdownopen(false)

  }
  return (
    <div>
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2 py-1 text-xs',
        {
          'bg-gray-100 text-gray-500': status === 'pending',
          'bg-green-500 text-white': status === 'paid',
          'bg-red-500 text-white': status === 'canceled',
          'bg-orange-500 text-white': status === 'overdue',
        },
      )}
      onClick={toggledropdown}
    >
      {status === 'pending' ? (
        <>
          Pending
          <ClockIcon className="ml-1 w-4 text-gray-500" />
        </>
      ) : null}
      {status === 'paid' ? (
        <>
          Paid
          <CheckIcon className="ml-1 w-4 text-white" />
        </>
      ) : null}
      {status === 'canceled' ? (
        <>
          Canceled
          <CheckIcon className="ml-1 w-4 text-white" />
        </>
      ) : null}
      {status === 'overdue' ? (
        <>
          Overdue
          <CheckIcon className="ml-1 w-4 text-white" />
        </>
      ) : null}
      <ChevronDownIcon />
    </span>
    {isDropdownopen && (
      <div className='absolute z-10 mt-1 bg-white border-gray-200 rounded shadow-lg w-28'>
        {possiblstatus.filter((s) => s !== current).map((s) => (
        <button className='w-full block px-4 py-2 text-left hover:bg-gray-100'
        onClick={() => handleStatuschange(s)}
        key={s}
        >{s}</button>
        ))}
      </div>
    )}
    </div>
  );
}
