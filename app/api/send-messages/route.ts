// import { NextResponse } from "next/server";

// // Define types for the request body
// interface RequestBody {
//   message: string;
//   recipientId: string;
// }

// // Define types for the Facebook API response
// interface FacebookApiError {
//   error: {
//     message: string;
//     [key: string]: string;
//   };
// }

// interface ApiResponse {
//   success: boolean;
//   data?: FacebookApiError;
//   error?: string;
// }

// export async function POST(req: Request): Promise<NextResponse<ApiResponse>> {
//   const { message, recipientId } = (await req.json()) as RequestBody;
//   const pageAccessToken: string | undefined = process.env.NEXT_PUBLIC_PAGE_ACCESS_TOKEN
//   // if (!message || !recipientId) {
//   //   return NextResponse.json(
//   //     { error: "Message and recipientId are required" },
//   //     { status: 400 }
//   //   );
//   // }

//   try {
//     const response = await fetch(
//       `https://graph.facebook.com/v20.0/me/messages?access_token=${pageAccessToken}`,
//       {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           recipient: { id: recipientId },
//           message: { text: message },
//         }),
//       }
//     );

//     const data = await response.json() as FacebookApiError;
    
  
//     return NextResponse.json({ success: true, data }, { status: 200 });
//   } catch  {
//     return NextResponse.json(
//       { success: false, },
//       { status: 500 }
//     );
//   }
// }