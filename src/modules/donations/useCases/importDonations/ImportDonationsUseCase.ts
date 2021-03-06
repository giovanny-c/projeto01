import { inject, injectable } from "tsyringe";

import fs from "fs"

import * as xlsx from "xlsx"

import { IDateProvider } from "../../../../shared/container/providers/dateProvider/IDateProvider";
import { IDonorsRepository } from "../../../donor/repositories/IDonorsRepository";
import { IUsersRepository } from "../../../user/repositories/IUsersRepository";
import { IWorkersReposiroty } from "../../../workers/repositories/IWorkersRepository";
import { IDonationsRepository } from "../../repositories/IDonationsRepository";

import { AppError } from "../../../../shared/errors/AppError";



interface IImportDonation {
    donation_value: number
    donation_number?: number,
    worker_name: string //worker
    donor_name: string
    email: string
    phone?: string
    created_at: Date
    is_payed: string
    payed_at?: Date
    is_canceled?: string
}


@injectable()
class ImportDonationsUseCase {

    constructor(
        @inject("DonationsRepository")
        private donationsRepository: IDonationsRepository,
        @inject("DonorsRepository")
        private donorsRepository: IDonorsRepository,
        @inject("UsersRepository")
        private usersRepository: IUsersRepository,
        @inject("WorkersRepository")
        private workersRepository: IWorkersReposiroty,
        @inject("DayjsDateProvider")
        private dateProviderRepository: IDateProvider
    ) {

    }


    loadDonations(file: Express.Multer.File): IImportDonation[] { //talvez tenha que ser asincrona

        let donationsObj: IImportDonation[]

        const excelData = xlsx.readFile(file.path, { cellDates: true }) //diskstorage



        Object.keys(excelData.Sheets).map(name => ({
            //cria um array de objs onde dentro de cada obj tem as donations

            donations: xlsx.utils.sheet_to_json(excelData.Sheets[name], { raw: false, dateNF: 'yyyy-mm-dd' }) as IImportDonation[],


        })).forEach(object => {

            donationsObj = object.donations

        })

        return donationsObj

    }

    validateFields(object: IImportDonation[]): void {

        object.forEach(data => {

            if (!data.email) throw new AppError(`Please fill the email field at line ${object.indexOf(data) + 1}`, 400) //testar se o erro ta na linha certa
            if (!data.donation_value) throw new AppError(`Please fill the donation_value field at line ${object.indexOf(data) + 1}`, 400)
            if (!data.created_at) throw new AppError(`Please fill the created_at field at line ${object.indexOf(data) + 1}`, 400)
            if (!data.worker_name) throw new AppError(`Please fill the worker_name field at line ${object.indexOf(data) + 1}`, 400)
            if (!data.donor_name) throw new AppError(`Please fill the donor_name field at line ${object.indexOf(data) + 1}`, 400)
            if (!data.phone) throw new AppError(`Please fill the phone field at line ${object.indexOf(data) + 1}`, 400)
            if (data.is_payed === "true" && data.is_canceled === "true") throw new AppError(`There cant be a donation payed mark as canceled, on line: ${object.indexOf(data) + 1}`, 400)

            // Fazer para created_at tbm
            if (!this.dateProviderRepository.isValidDate(data.created_at)) {
                throw new AppError(`Invalid date at payed_at on line: ${object.indexOf(data) + 1}`, 400)
            }

            // ve se a data de pagamento ?? validaq
            if (!this.dateProviderRepository.isValidDate(data.payed_at)) {
                throw new AppError(`Invalid date at payed_at on line: ${object.indexOf(data) + 1}`, 400)// status code
            }

        });

    }

    async proccessDonations(object: IImportDonation[], user_id: string): Promise<void | string> {

        this.validateFields(object)

        object.forEach(async (data): Promise<any> => {



            //Valida????o de campos
            //try {
            let is_payed: boolean, is_canceled: boolean

            if (data.is_payed === "true") is_payed = true

            if (data.is_canceled === "true") is_canceled = true


            if (data.created_at) this.dateProviderRepository.convertToDate(data.created_at)
            //se tiver, converte a data de pagamento 
            if (data.payed_at) this.dateProviderRepository.convertToDate(data.payed_at)


            //PODE HAVER ERROS DE DIGITA??AO NOS CAMPOS QUE CAUSEM A CRIA??AO DE NOVOS DONOR E WORKERS
            //procura donor
            let donor = await this.donorsRepository.findByEmail(data.email)
            //se nao existir, cria
            if (!donor) {
                donor = await this.donorsRepository.create({
                    name: data.donor_name,
                    email: data.email,
                    phone: data.phone
                })
            }

            //procura worker
            let worker = await this.workersRepository.findByName(data.worker_name)
            //se  nao existir, cria
            if (!worker) {
                worker = await this.workersRepository.create(data.worker_name)
            }


            try {
                //CRIA A DONATION
                await this.donationsRepository.create({

                    donation_value: data.donation_value,
                    donor_id: donor.id,
                    user_id: user_id,
                    worker_id: worker.id,
                    //donation_number: data.donation_number // fazer outra estrategia p/ number (tirar auto generate)
                    created_at: data.created_at,
                    is_payed: is_payed,
                    payed_at: data.payed_at || null,
                    is_donation_canceled: is_canceled,


                })

                //LOGICA PARA NAO FAZER A MESMA DONATION 2 VEZES

            } catch (err) {

                throw new AppError(`It was not possible to create donations. Error: ${err} | on: ${object.indexOf(data) + 1}`)
                //return `It was not possible to create donations. Error: ${err} | on: ${object.indexOf(data) + 1}`
            }

            //poe a data da ultima doa??ao no donor se for paga
            if (is_payed === true) {

                await this.donorsRepository.create({ id: donor.id, last_donation: data.payed_at })

            }

        })



    }


    async execute(file: Express.Multer.File, user_id: string): Promise<any> {


        //vai fazer para cada donation
        const result = await this.proccessDonations(this.loadDonations(file), user_id)

        fs.unlinkSync(file.path)

        return result


    }


}

export { ImportDonationsUseCase }