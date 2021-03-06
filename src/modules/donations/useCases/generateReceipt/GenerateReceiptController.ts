import { decodeBase64 } from "bcryptjs";
import { Request, Response } from "express";
import { container } from "tsyringe";
import { GenerateReceiptUseCase } from "./GenerateReceiptUseCase";



class GenerateReceiptController {


    async handle(req: Request, res: Response): Promise<any> {

        const { id } = req.params

        const generateReceiptUseCase = container.resolve(GenerateReceiptUseCase)

        const document = await generateReceiptUseCase.execute(id, res)

        return res.status(201).render("donations/donationReceipt", { document })

    }
}

export { GenerateReceiptController }