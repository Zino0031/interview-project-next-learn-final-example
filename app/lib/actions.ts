'use server';

import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import { fetchInvoiceById } from './data';

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer.',
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.',
  }),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ date: true, id: true });

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

export async function createInvoice(prevState: State, formData: FormData) {
  // Validate form fields using Zod
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }

  // Prepare data for insertion into the database
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];

  // Insert data into the database
  try {
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
  } catch (error) {
    // If a database error occurs, return a more specific error.
    return {
      message: 'Database Error: Failed to Create Invoice.',
    };
  }

  // Revalidate the cache for the invoices page and redirect the user.
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function updateInvoice(
  id: string,
  prevState: State,
  formData: FormData,
  userName:string
) {
  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Invoice.',
    };
  }

  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;

  try {

    const invoice = await fetchInvoiceById(id)

    if (!invoice) {
      return {
        message: 'invoice not found',
      };
    }
  
    const previousStatus = invoice.status

    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `;

    if (previousStatus !== status) {
      await logStatusChange(id,previousStatus,status,userName)
    }
  } catch (error) {
    return { message: 'Database Error: Failed to Update Invoice.' };
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function cancelInvoice(id: string,userName:string) {
  // throw new Error('Failed to Delete Invoice');

  try {


  const invoice = await fetchInvoiceById(id)

  if (!invoice) {
    return {
      message: 'invoice not found',
    };
  }

  const previousStatus = invoice.status
    await sql`UPDATE invoices SET status= 'canceled' WHERE id = ${id}`;

    await logStatusChange(id, previousStatus, 'canceled',userName)
    revalidatePath('/dashboard/invoices');
    return { message: 'canceled Invoice' };
  } catch (error) {
    return { message: 'Database Error: Failed to canceled Invoice.' };
  }
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}


export async function updateInvoiceStatus(
  id: string,
  newStatus: string,
  userName:string,
) {
  const validatedStatus= ['pending', 'paid','canceled','overdue'] 

  if (!validatedStatus.includes(newStatus)) {
    return {
      message: 'invalid status.',
    };
  }
  if (!userName) {
    return {
      message: 'user not auth.',
    };
  }


  const invoice = await fetchInvoiceById(id)

  if (!invoice) {
    return {
      message: 'invoice not found',
    };
  }

  const previousStatus = invoice.status

  try {
    await sql`
      UPDATE invoices
      SET status = ${newStatus}
      WHERE id = ${id}
    `;

    logStatusChange(id,previousStatus,newStatus, userName )
  } catch (error) {
    return { message: 'Database Error: Failed to Update Invoice.' };
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}


export async function logStatusChange(invoiceId : string ,previousStatus:string,newStatus:string,changedby:string){
  try {
    await sql`
    INSERT INTO status_changes (invoice_id, previous_status, new_status, changed_by)
    VALUES (${invoiceId},${previousStatus},${newStatus},${changedby})
    `;
  } catch (error){
    return { message: 'Database Error: Failed logging status change.' };
  }
}



export async function restoreInvoiceStatus(invoiceId:string,previousStatus:string,userName:string){
  const validatedStatus= ['pending', 'paid','canceled','overdue'] 

  if (!validatedStatus.includes(previousStatus)) {
    return {
      message: 'invalid status.',
    };
  }
  if (!userName) {
    return {
      message: 'user not auth.',
    };
  }
  try {
    await sql`
      UPDATE invoices
      SET status = ${previousStatus}
      WHERE id = ${invoiceId}
    `;

    logStatusChange(invoiceId,previousStatus,previousStatus, userName )


  revalidatePath('/dashboard/invoices');
  return { message : 'invoice status restired'}


}catch (error) {
  return { message: 'Database Error: Failed restore status change.' };
}
}