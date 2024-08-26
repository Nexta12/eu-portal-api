import { MigrationInterface, QueryRunner } from "typeorm";

export class ProgrammeUpdate1687298388909 implements MigrationInterface {
    name = 'ProgrammeUpdate1687298388909'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "programmes" ADD "programmeType" character varying NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "programmes" DROP COLUMN "programmeType"`);
    }

}
