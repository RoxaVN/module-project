import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitModuleProject1704206526273 implements MigrationInterface {
  name = 'InitModuleProject1704206526273';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "task" (
        "id" BIGSERIAL NOT NULL,
        "userId" uuid NOT NULL,
        "assignee" uuid,
        "parentId" bigint,
        "parents" bigint array,
        "childrenCount" integer NOT NULL DEFAULT '0',
        "progress" integer NOT NULL DEFAULT '0',
        "weight" integer NOT NULL DEFAULT '1',
        "childrenWeight" integer NOT NULL DEFAULT '0',
        "status" text NOT NULL DEFAULT 'pending',
        "title" text NOT NULL,
        "projectId" bigint NOT NULL,
        "metadata" jsonb,
        "createdDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "expiryDate" TIMESTAMP WITH TIME ZONE NOT NULL,
        "startedDate" TIMESTAMP WITH TIME ZONE,
        "finishedDate" TIMESTAMP WITH TIME ZONE,
        "rejectedDate" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_fb213f79ee45060ba925ecd576e" PRIMARY KEY ("id")
      )
      `);
    await queryRunner.query(`
      CREATE INDEX "IDX_f316d3fe53497d4d8a2957db8b" ON "task" ("userId")
      `);
    await queryRunner.query(`
      CREATE INDEX "IDX_8d511d8adacc304ec05628f524" ON "task" ("assignee")
      `);
    await queryRunner.query(`
      CREATE INDEX "IDX_8c9920b5fb32c3d8453f64b705" ON "task" ("parentId")
      `);
    await queryRunner.query(`
      CREATE TABLE "project" (
        "id" BIGSERIAL NOT NULL,
        "type" text NOT NULL DEFAULT 'default',
        "isPublic" boolean NOT NULL DEFAULT false,
        "userId" uuid NOT NULL,
        "name" text NOT NULL,
        "metadata" jsonb,
        "createdDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_4d68b1358bb5b766d3e78f32f57" PRIMARY KEY ("id")
      )
      `);
    await queryRunner.query(`
      CREATE INDEX "IDX_c12e6e89450120f04629168752" ON "project" ("type")
      `);
    await queryRunner.query(`
      CREATE INDEX "IDX_7c4b0d3b77eaf26f8b4da879e6" ON "project" ("userId")
      `);
    await queryRunner.query(`
      ALTER TABLE "task"
      ADD CONSTRAINT "FK_3797a20ef5553ae87af126bc2fe" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "task" DROP CONSTRAINT "FK_3797a20ef5553ae87af126bc2fe"
      `);
    await queryRunner.query(`
      DROP INDEX "public"."IDX_7c4b0d3b77eaf26f8b4da879e6"
      `);
    await queryRunner.query(`
      DROP INDEX "public"."IDX_c12e6e89450120f04629168752"
      `);
    await queryRunner.query(`
      DROP TABLE "project"
      `);
    await queryRunner.query(`
      DROP INDEX "public"."IDX_8c9920b5fb32c3d8453f64b705"
      `);
    await queryRunner.query(`
      DROP INDEX "public"."IDX_8d511d8adacc304ec05628f524"
      `);
    await queryRunner.query(`
      DROP INDEX "public"."IDX_f316d3fe53497d4d8a2957db8b"
      `);
    await queryRunner.query(`
      DROP TABLE "task"
      `);
  }
}
