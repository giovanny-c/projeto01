import { degrees, PDFDocument, rgb } from "pdf-lib"
import fs from "fs"
import intl from "intl"

import { IFileProvider } from "../IFileProvider";
import { Donation } from "../../../../../modules/donations/entities/donation";
import formatToBRL from "../../../../../../utils/numberFormat";




class PDF_LIBFileProvider implements IFileProvider {

    async createFile(filePath: string, data?: Donation,) {

        const doc = await PDFDocument.create()

        const uint8Array = fs.readFileSync(filePath) // le o tamplate do recibo


        const templatePNG = await doc.embedPng(uint8Array) //poe o template no pdf

        const page = doc.addPage()

        page.setRotation(degrees(90))

        page.drawImage(templatePNG, { //"desenha" a imagem
            x: 500,
            y: 10,
            width: 800,
            height: 500,
            rotate: degrees(90)
        })

        page.drawText(data.donation_number.toString(), {
            x: 85,
            y: 350,
            rotate: degrees(90),
            color: rgb(0.95, 0.1, 0.1),
            size: 30

        })


        page.drawText(formatToBRL(data.donation_value as number).toString(), {
            x: 85,
            y: 570,
            rotate: degrees(90),

            size: 30,


        })

        page.drawText(data.donor.name, {
            x: 142,
            y: 220,
            rotate: degrees(90),

            size: 30,


        })

        page.drawText(data.payed_at.toString(), {
            x: 360,
            y: 110,
            rotate: degrees(90),

            size: 25,


        })



        const pdfBytes = await doc.save() //cria um array de bytes 

        //criar o pdf no dir
        fs.writeFile(`./tmp/receipts/recibo${data.donation_number}.pdf`, pdfBytes,
            (err) => {
                if (err) throw err
            })

        return pdfBytes
    }

}

export { PDF_LIBFileProvider }