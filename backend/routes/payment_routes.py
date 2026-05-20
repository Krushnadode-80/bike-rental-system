import razorpay
import os
import qrcode
import base64

from io import BytesIO

from dotenv import load_dotenv

from fastapi import APIRouter, HTTPException

from pydantic import BaseModel

# Load environment variables - explicitly from backend .env with override
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
load_dotenv(dotenv_path=env_path, override=True)

router = APIRouter()

# Environment Variables
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")

RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")

# Debug: Print which keys are loaded (masked)
print(f"PAYMENT: Using Razorpay Key ID: {RAZORPAY_KEY_ID}")
print(f"PAYMENT: Secret ends with: ...{RAZORPAY_KEY_SECRET[-4:] if RAZORPAY_KEY_SECRET else 'NONE'}")

UPI_ID = os.getenv("UPI_ID")

# Validate Keys
if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:

    raise Exception(
        "Razorpay keys missing in .env"
    )

# Initialize Razorpay Client
client = razorpay.Client(auth=(

    RAZORPAY_KEY_ID,

    RAZORPAY_KEY_SECRET

))

# ----------------------------
# REQUEST MODELS
# ----------------------------

class OrderRequest(BaseModel):

    amount: int


class VerifyRequest(BaseModel):

    razorpay_order_id: str

    razorpay_payment_id: str

    razorpay_signature: str


# ----------------------------
# CREATE ORDER
# ----------------------------

@router.post("/create-order")

async def create_order(

    request: OrderRequest
):

    try:

        if request.amount <= 0:

            raise HTTPException(

                status_code=400,

                detail="Amount must be greater than 0"
            )

        amount_paise = request.amount * 100

        order = client.order.create({

            "amount": amount_paise,

            "currency": "INR",

            "payment_capture": 1
        })

        return {

            "success": True,

            "order": order
        }

    except Exception as e:

        print(f"RAZORPAY ERROR: {str(e)}")

        raise HTTPException(

            status_code=400,

            detail=f"Failed to create order: {str(e)}"
        )


# ----------------------------
# VERIFY PAYMENT
# ----------------------------

@router.post("/verify-payment")

async def verify_payment(

    request: VerifyRequest
):

    try:

        client.utility.verify_payment_signature({

            "razorpay_order_id":
            request.razorpay_order_id,

            "razorpay_payment_id":
            request.razorpay_payment_id,

            "razorpay_signature":
            request.razorpay_signature
        })

        return {

            "success": True,

            "message":
            "Payment Verified Successfully"
        }

    except Exception as e:

        print(f"VERIFICATION ERROR: {str(e)}")

        raise HTTPException(

            status_code=400,

            detail="Payment Verification Failed"
        )


# ----------------------------
# GENERATE QR CODE
# ----------------------------

@router.get("/generate-qr")

async def generate_qr(

    amount: int
):

    try:

        if amount <= 0:

            raise HTTPException(

                status_code=400,

                detail="Invalid amount"
            )

        upi_link = (

            f"upi://pay?"

            f"pa={UPI_ID}"

            f"&pn=BikeRental"

            f"&am={amount}"

            f"&cu=INR"
        )

        img = qrcode.make(upi_link)

        buffered = BytesIO()

        img.save(

            buffered,

            format="PNG"
        )

        img_str = base64.b64encode(

            buffered.getvalue()

        ).decode()

        return {

            "success": True,

            "upi_link": upi_link,

            "qr_image":
            f"data:image/png;base64,{img_str}"
        }

    except Exception as e:

        print(f"QR ERROR: {str(e)}")

        raise HTTPException(

            status_code=500,

            detail=str(e)
        )