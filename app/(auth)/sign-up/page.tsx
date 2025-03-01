"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import Link from "next/link";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

const signUpSchema = z.object({
    name: z.string().min(1, "Full name is required"),
    email: z.string().min(1, "Email is required").email("Invalid email"),
    password: z
      .string()
      .min(1, "Must be at least 8 characters")
      .max(32, "Cannot exceed 32 characters"),
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });


export default function SignUp() {

	const [loading, setLoading] = useState(false);
	const { toast } = useToast();

	const form = useForm<z.infer<typeof signUpSchema>>({
		resolver: zodResolver(signUpSchema),
		defaultValues: {
			name: "",
			email: "",
			password: "",
			confirmPassword: "",
			
		},
	});



	const onSubmit = async (values: z.infer<typeof signUpSchema>) => {
		
			setLoading(true)  

		await authClient.signUp.email(
		  {
			email: values.email,
			password: values.password,
			name: values.name,
			callbackURL: "/sign-in" 
		  },
		  {
			onRequest: () => {
			
			setLoading(true)},

			onSuccess: () => {
			  toast({
				title: "Account created",
				description:
				  "Your account has been created. Check your email for a verification link.",
			  });
			  setLoading(false)
			},
			onError: (ctx) => {
			  toast({
				title: "Something went wrong",
				description: ctx.error.message ?? "Something went wrong.",
			  });
			  setLoading(false);
			},
		  }
		);
	  };
	  
if (loading) return <p className="text-center"> please wait....</p>



	return (
		<div className="grow flex items-center justify-center p-2">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle className="text-3xl font-bold text-center text-gray-800">
						Create Account
					</CardTitle>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
							{["name", "email", "password", "confirmPassword"].map((field) => (
								<FormField
									control={form.control}
									key={field}
									name={field as keyof z.infer<typeof signUpSchema>}
									render={({ field: fieldProps }) => (
										<FormItem>
											<FormLabel>
												{field.charAt(0).toUpperCase() + field.slice(1)}
											</FormLabel>
											<FormControl>
												<Input
													type={
														field.includes("password")
															? "password"
															: field === "email"
															? "email"
															: "text"
													}
													placeholder={`Enter your ${field}`}
													{...fieldProps}
													autoComplete="off"
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							))}
                             <Button type="submit">Create</Button>
						</form>
                       
					</Form>
					<div className="mt-4 text-center text-sm">
						<Link href="/sign-in" className="text-primary hover:underline">
							Already have an account? Sign in
						</Link>
					</div>
				</CardContent>
			</Card>
		</div>
		
	);
}