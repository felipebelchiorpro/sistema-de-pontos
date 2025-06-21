
"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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
  title: "",
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
  const [state, formAction] = useActionState(addPartnerAction, initialState);
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
        title: state.title || "Sucesso!",
        description: state.message,
      });
      form.reset(); 
    } else if (!state.success && state.message) {
      const errorFields = state.errors as any;
      let shownFieldErrorToast = false;

      if (errorFields) {
        if (errorFields.name?.[0]) {
          form.setError("name", { type: "manual", message: errorFields.name[0] });
          shownFieldErrorToast = true;
        }
        if (errorFields.coupon?.[0]) {
          form.setError("coupon", { type: "manual", message: errorFields.coupon[0] });
          shownFieldErrorToast = true;
        }
        if (errorFields._form?.[0]) {
           toast({
                title: state.title || "Erro",
                description: errorFields._form[0],
                variant: "destructive",
            });
           shownFieldErrorToast = true; // Consider this as a field error for toast logic
        }
      }
      
      if (!shownFieldErrorToast && state.message) {
         toast({
            title: state.title || "Erro ao cadastrar parceiro",
            description: state.message,
            variant: "destructive",
        });
      }
    }
  }, [state, toast, form]);


  const handleFormSubmit = (data: PartnerFormData) => {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("coupon", data.coupon.toUpperCase());
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
             {/* Server-side field error for name, if not already set by client-side RHF */}
             {state?.errors?.name && Array.isArray(state.errors.name) && !form.formState.errors.name && (
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
            {/* Server-side field error for coupon, if not already set by client-side RHF */}
            {state?.errors?.coupon && Array.isArray(state.errors.coupon) && !form.formState.errors.coupon && (
               <p className="text-sm text-destructive">{state.errors.coupon[0]}</p>
            )}
          </div>
          
          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}
