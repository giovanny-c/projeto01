import { container } from "tsyringe";

import { IDonationsRepository } from "../../modules/donations/repositories/IDonationsRepository";
import { DonationsRepository } from "../../modules/donations/repositories/implementation/DonationsRepository";

import { IDonorsRepository } from "../../modules/donor/repositories/IDonorsRepository";
import { DonorsRepository } from "../../modules/donor/repositories/implemantations/DonorsRepository";

import { UsersRepository } from "../../modules/user/repositories/implementation/UsersRepository";
import { IUsersRepository } from "../../modules/user/repositories/IUsersRepository";



container.registerSingleton<IUsersRepository>(
    "UsersRepository",
    UsersRepository
)

container.registerSingleton<IDonorsRepository>(
    "DonorsRepository",
    DonorsRepository
)


container.registerSingleton<IDonationsRepository>(
    "DonationsRepository",
    DonationsRepository
)