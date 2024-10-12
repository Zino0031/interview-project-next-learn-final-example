import Form from '@/app/ui/invoices/edit-form';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import { fetchInvoiceById, fetchCustomers, fetchStatusChangeLogs } from '@/app/lib/data';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Logs from '@/app/ui/invoices/logs';

export const metadata: Metadata = {
  title: 'Edit Invoice',
};

export default async function Page({ params }: { params: { id: string } }) {
  const id = params.id;
  const [invoice, customers, StatusChangeLogs] = await Promise.all([
    fetchInvoiceById(id),
    fetchCustomers(),
    fetchStatusChangeLogs(id),
  ]);

  if (!invoice) {
    notFound();
  }

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Invoices', href: '/dashboard/invoices' },
          {
            label: 'Edit Invoice',
            href: `/dashboard/invoices/${id}/edit`,
            active: true,
          },
        ]}
      />
      <Form invoice={invoice} customers={customers} />
      <Logs logs={StatusChangeLogs} invoiceid={invoice.id} />
    </main>
  );
}
