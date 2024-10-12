'use client'
import { restoreInvoiceStatus } from '@/app/lib/actions';
import { useSession } from 'next-auth/react';
import React from 'react'




    type LogsProps ={
        logs: any[];
        invoiceid:string
    }
    const Logs :React.FC<LogsProps>  = ({logs, invoiceid}) => {
    
  const { data: Session } = useSession()
  const userName = Session?.user?.name
  if (!userName){
    throw new Error('user not auth')
}
        const handleRestore = async (previousStatus:string)=> {
            const result = await restoreInvoiceStatus(invoiceid, previousStatus,userName)
        }

    return (
        <div>
            <h2 className='text-lg font-semibold'>Status Change</h2>
            <div className='mt-2'>
                {logs.length === 0 ? (
                    <p>No status change</p>
                ):(
                    <ul className='devide_y devide-gray-200'>
                        {logs.map((log,index)=>(
                            <li key={index} className='my-2 p-2 flex items-center justify-between bg-gray-100 rounded-4xl'>
                                <div>
                                    <p>
                                        <strong>Changed By :</strong> {log.changed_by} <br />
                                        <strong>New Status</strong> {log.new_status} <br />
                                        <strong>Previous Status</strong> {log.previous_status} <br />
                                        <strong>Changed At:</strong> {new Date(log.changed_at).toLocaleString()} <br />
                                    </p>
                                </div>
                                <button
                                onClick={() => handleRestore(log.previous_status)}
                                className='ml-4 text-blue-500'>
                                Restore                                    
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    )
    }

    export default Logs