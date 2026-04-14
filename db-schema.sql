-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Table `users`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `users` ;

CREATE TABLE IF NOT EXISTS `users` (
  `user_id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(32) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `profile_picture_path` VARCHAR(255) NOT NULL,
  `temp_unit` ENUM('F', 'C', 'K') NOT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE INDEX `username_UNIQUE` (`username` ASC) VISIBLE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `favorite_days`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `favorite_days` ;

CREATE TABLE IF NOT EXISTS `favorite_days` (
  `day_id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `country_name` VARCHAR(64) NOT NULL,
  `state_name` VARCHAR(64) NOT NULL DEFAULT '',
  `city_name` VARCHAR(64) NOT NULL,
  `longitude` DECIMAL(9,6) NOT NULL,
  `latitude` DECIMAL(9,6) NOT NULL,
  `weather_data` JSON NOT NULL,
  `day_date` DATE NOT NULL,
  PRIMARY KEY (`day_id`),
  INDEX `user_id_idx` (`user_id` ASC) VISIBLE,
  UNIQUE INDEX `unique_user_location_day` (`user_id` ASC, `country_name` ASC, `state_name` ASC, `city_name` ASC, `day_date` ASC) VISIBLE,
  CONSTRAINT `fk_favorite_days_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`user_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `notes`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `notes` ;

CREATE TABLE IF NOT EXISTS `notes` (
  `note_id` INT NOT NULL AUTO_INCREMENT,
  `day_id` INT NOT NULL,
  `note_text` TEXT NOT NULL,
  `icon_path` VARCHAR(255) NOT NULL,
  `note_title` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`note_id`),
  INDEX `day_id_notes_idx` (`day_id` ASC) VISIBLE,
  CONSTRAINT `fk_notes_day`
    FOREIGN KEY (`day_id`)
    REFERENCES `favorite_days` (`day_id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
