"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { addPartnerAction } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { UserPlus } from "lucide-react";

const PartnerSchema = z.object({
  name: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres." }),
  coupon: z.string().min(3, { message: "Cupom deve ter pelo menos 3 caracteres." }).regex(/^[A-Z0-9]+$/, { message: 'Cupom deve ser em maiúsculas e conter apenas letras e números (ex: PARCEIRO123).' }),
});

type PartnerFormData = z.infer<typeof PartnerSchema>;

const initialState = {
  message: "",
  errors: {},
  success: false,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? "Cadastrando..." : "Cadastrar Parceiro"}
      {!pending && <UserPlus className="ml-2 h-4 w-4" />}
    </Button>
  );
}

export function PartnerForm() {
  const [state, formAction] = useFormState(addPartnerAction, initialState);
  const { toast } = useToast();

  const form = useForm<PartnerFormData>({
    resolver: zodResolver(PartnerSchema),
    defaultValues: {
      name: "",
      coupon: "",
    },
  });

  useEffect(() => {
    if (state.success) {
      toast({
        title: "Sucesso!",
        description: state.message,
      });
      form.reset(); // Reset form fields
      // Reset form state from useFormState manually if needed, or rely on new submissions
    } else if (state.message && !state.success && Object.keys(state.errors || {}).length > 0) {
       // Prioritize field errors from Zod/action if available
      const errorFields = state.errors as any;
      if (errorFields?.name) form.setError("name", { type: "manual", message: errorFields.name[0] });
      if (errorFields?.coupon) form.setError("coupon", { type: "manual", message: errorFields.coupon[0] });
      if (!errorFields?.name && !errorFields?.coupon && state.message) { // general error
         toast({
            title: "Erro ao cadastrar parceiro",
            description: state.message,
            variant: "destructive",
         });
      }
    } else if (state.message && !state.success) {
        toast({
            title: "Erro",
            description: state.message,
            variant: "destructive",
        });
    }
  }, [state, toast, form]);


  const handleFormSubmit = (data: PartnerFormData) => {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("coupon", data.coupon.toUpperCase()); // Ensure coupon is uppercase
    formAction(formData);
  };
  
  const handleCouponChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    form.setValue("coupon", event.target.value.toUpperCase(), { shouldValidate: true });
  };


  return (
    <Card className="w-full max-w-lg bg-card">
      <CardHeader>
        <CardTitle>Cadastrar Novo Parceiro</CardTitle>
        <CardDescription>Preencha os dados para adicionar um novo parceiro ao sistema.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Parceiro</Label>
            <Input
              id="name"
              {...form.register("name")}
              placeholder="Ex: Loja Exemplo"
              className="bg-input"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
             {state?.errors?.name && (
              <p className="text-sm text-destructive">{state.errors.name[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="coupon">Cupom Único</Label>
            <Input
              id="coupon"
              {...form.register("coupon")}
              placeholder="Ex: PARCEIRO123"
              onChange={handleCouponChange}
              className="bg-input"
            />
            <p className="text-xs text-muted-foreground">Use letras maiúsculas e números. Ex: MEUCUPOM25</p>
            {form.formState.errors.coupon && (
              <p className="text-sm text-destructive">{form.formState.errors.coupon.message}</p>
            )}
            {state?.errors?.coupon && (
               <p className="text-sm text-destructive">{state.errors.coupon[0]}</p>
            )}
          </div>
          
          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}
