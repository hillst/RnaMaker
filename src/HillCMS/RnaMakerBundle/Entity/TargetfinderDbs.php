<?php

namespace HillCMS\RnaMakerBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * TargetfinderDbs
 *
 * @ORM\Table(name="targetfinder_dbs")
 * @ORM\Entity
 */
class TargetfinderDbs
{
    /**
     * @var string
     *
     * @ORM\Column(name="db_label", type="string", length=100, nullable=false)
     */
    private $dbLabel;

    /**
     * @var string
     *
     * @ORM\Column(name="db_path", type="string", length=50, nullable=false)
     */
    private $dbPath;

    /**
     * @var string
     *
     * @ORM\Column(name="species", type="string", length=25, nullable=false)
     */
    private $species;

    /**
     * @var integer
     *
     * @ORM\Column(name="db_id", type="integer")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="IDENTITY")
     */
    private $dbId;



    /**
     * Set dbLabel
     *
     * @param string $dbLabel
     * @return TargetfinderDbs
     */
    public function setDbLabel($dbLabel)
    {
        $this->dbLabel = $dbLabel;
    
        return $this;
    }

    /**
     * Get dbLabel
     *
     * @return string 
     */
    public function getDbLabel()
    {
        return $this->dbLabel;
    }

    /**
     * Set dbPath
     *
     * @param string $dbPath
     * @return TargetfinderDbs
     */
    public function setDbPath($dbPath)
    {
        $this->dbPath = $dbPath;
    
        return $this;
    }

    /**
     * Get dbPath
     *
     * @return string 
     */
    public function getDbPath()
    {
        return $this->dbPath;
    }

    /**
     * Set species
     *
     * @param string $species
     * @return TargetfinderDbs
     */
    public function setSpecies($species)
    {
        $this->species = $species;
    
        return $this;
    }

    /**
     * Get species
     *
     * @return string 
     */
    public function getSpecies()
    {
        return $this->species;
    }

    /**
     * Get dbId
     *
     * @return integer 
     */
    public function getDbId()
    {
        return $this->dbId;
    }
}