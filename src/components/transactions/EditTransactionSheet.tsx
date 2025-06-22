
'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DatePicker } from '@/components/ui/date-picker';
import { updateTransactionAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import type { Partner, Transaction } from '@/types';
import { TransactionType } from '@/types';
import { DollarSign, Gift, CheckCircle } from 'lucide-react';
import { parseISO } from 'date-fns';

interface EditTransactionSheetProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  transaction: Transaction;
  partners: Partner[];
}

const EditSaleSchema = z.object({
  partnerId: z.string().uuid({ message: "Por favor, selecione um parceiro." }),
  totalSaleValue: z.coerce.number().positive({ message: "O valor da venda deve ser positivo." }),
  externalSaleId: z.string().optional(),
  saleDate: z.date({ required_error: "A data da venda é obrigatória." }),
});

const EditRedemptionSchema = z.object({
  partnerId: z.string().uuid({ message: "Por favor, selecione um parceiro." }),
  pointsToRedeem: z.coerce.number().positive({ message: "Os pontos para resgate devem ser positivos." }),
  redemptionDate: z.date({ required_error: "A data do resgate é obrigatória." }),
});

const getValidationSchema = (type: TransactionType) => {
    return type === TransactionType.SALE ? EditSaleSchema : EditRedemptionSchema;
}

type EditFormData = z.infer<typeof EditSaleSchema> | z.infer<typeof EditRedemptionSchema>;


function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Salvando...' : 'Salvar Alterações'}
      {!pending && <CheckCircle className="ml-2 h-4 w-4" />}
    </Button>
  );
}

const initialState = { title: "", message: "", errors: {}, success: false };

export function EditTransactionSheet({ isOpen, setIsOpen, transaction, partners }: EditTransactionSheetProps) {
  const [state, formAction] = useActionState(updateTransactionAction, initialState);
  const { toast } = useToast();
  
  const form = useForm<EditFormData>({
    resolver: zodResolver(getValidationSchema(transaction.type)),
    defaultValues: transaction.type === TransactionType.SALE ? {
        partnerId: transaction.partnerId,
        totalSaleValue: transaction.originalSaleValue || 0,
        externalSaleId: transaction.externalSaleId || '',
        saleDate: transaction.date ? parseISO(transaction.date) : new Date(),
    } : {
        partnerId: transaction.partnerId,
        pointsToRedeem: transaction.amount,
        redemptionDate: transaction.date ? parseISO(transaction.date) : new Date(),
    }
  });

   useEffect(() => {
    // Reset form when a new transaction is passed in
    form.reset(
        transaction.type === TransactionType.SALE ? {
            partnerId: transaction.partnerId,
            totalSaleValue: transaction.originalSaleValue || 0,
            externalSaleId: transaction.externalSaleId || '',
            saleDate: transaction.date ? parseISO(transaction.date) : new Date(),
        } : {
            partnerId: transaction.partnerId,
            pointsToRedeem: transaction.amount,
            redemptionDate: transaction.date ? parseISO(transaction.date) : new Date(),
        }
    )
   }, [transaction, form]);
  
  useEffect(() => {
    if (state.success) {
      toast({
        title: state.title || 'Sucesso!',
        description: state.message,
      });
      setIsOpen(false);
    } else if (!state.success && state.message) {
        toast({
            title: state.title || 'Erro',
            description: state.message,
            variant: "destructive",
        });
    }
  }, [state, toast, setIsOpen]);
  
  const handleFormSubmit = (data: EditFormData) => {
    const formData = new FormData();
    formData.append('transactionId', transaction.id);
    formData.append('transactionType', transaction.type);

    if (transaction.type === TransactionType.SALE) {
        const saleData = data as z.infer<typeof EditSaleSchema>;
        formData.append('partnerId', saleData.partnerId);
        formData.append('totalSaleValue', saleData.totalSaleValue.toString());
        if (saleData.externalSaleId) formData.append('externalSaleId', saleData.externalSaleId);
        if (saleData.saleDate) formData.append('saleDate', saleData.saleDate.toISOString());
    } else {
        const redemptionData = data as z.infer<typeof EditRedemptionSchema>;
        formData.append('partnerId', redemptionData.partnerId);
        formData.append('pointsToRedeem', redemptionData.pointsToRedeem.toString());
        if (redemptionData.redemptionDate) formData.append('redemptionDate', redemptionData.redemptionDate.toISOString());
    }
    
    formAction(formData);
  };
  
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Editar Transação</SheetTitle>
          <SheetDescription>
            Modifique os detalhes da transação. As alterações irão ajustar os saldos de pontos dos parceiros envolvidos.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6 py-6">
                {transaction.type === TransactionType.SALE && (
                    <>
                        <FormField control={form.control} name="partnerId" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Parceiro</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue placeholder="Selecione um parceiro" /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {partners.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.coupon})</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                         <FormField control={form.control} name="totalSaleValue" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Valor Total da Compra (R$)</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input type="number" step="0.01" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} className="pl-9" />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="externalSaleId" render={({ field }) => (
                             <FormItem>
                                <FormLabel>Código da Venda (Externo)</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="saleDate" render={({ field }) => (
                             <FormItem className="flex flex-col">
                                <FormLabel>Data da Venda</FormLabel>
                                <DatePicker date={field.value} setDate={field.onChange} />
                                <FormMessage />
                            </FormItem>
                        )} />
                    </>
                )}
                {transaction.type === TransactionType.REDEMPTION && (
                    <>
                        <FormField control={form.control} name="partnerId" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Parceiro</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue placeholder="Selecione um parceiro" /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {partners.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.coupon})</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                         <FormField control={form.control} name="pointsToRedeem" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Pontos a Resgatar</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Gift className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input type="number" step="0.01" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} className="pl-9" />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="redemptionDate" render={({ field }) => (
                             <FormItem className="flex flex-col">
                                <FormLabel>Data do Resgate</FormLabel>
                                <DatePicker date={field.value} setDate={field.onChange} />
                                <FormMessage />
                            </FormItem>
                        )} />
                    </>
                )}
                <SheetFooter className="pt-4">
                    <SheetClose asChild>
                        <Button type="button" variant="outline">Cancelar</Button>
                    </SheetClose>
                    <SubmitButton />
                </SheetFooter>
            </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
