# Buffer Tree Reservation Script

## Objective  
Develop a Node.js script to **reserve buffer trees at the plot level**. These reserved trees will be used later if other trees in the same plot die.  

---

## Reservation Rules  

1. **Scope**  
   - Operates at **plot level**.  
   - Within each plot, apply reservation logic **per plant type**.  

2. **Reservation Percentage**  
   - Reserve **20% of trees** for each plant type within a plot.  
   - Round up to the nearest whole number if the percentage results in a fraction.  

3. **Eligibility**  
   - Only trees that are **not yet reserved** can be considered.  
   - A tree is considered available if:  
     ```sql
     mapped_to_group IS NULL AND mapped_to_user IS NULL
     ```  

4. **Re-run Logic**  
   - If the script runs again on the same plot, it must:  
     - Identify **already reserved buffer trees** (criteria below).  
     - Re-use them instead of creating duplicate reservations.  
     - Only reserve additional trees if the existing reserved buffer is less than required.  
   - Already reserved buffer tree =  
     ```sql
     mapped_to_group    = 195
     sponsored_by_group = 195
     assigned_to        = 20621
     ```  

5. **Reservation Action**  
   - Trees selected for reservation should be updated as:  
     ```sql
     mapped_to_group     = 195,
     sponsored_by_group  = 195,
     assigned_to         = 20621,
     mapped_at           = NOW(),
     assigned_at         = NOW(),
     updated_at          = NOW(),
     sponsored_at        = NOW()
     ```  

---

## Dry-Run Mode  
- The script should support a **dry-run flag**.  
- In dry-run mode:  
  - Perform all calculations and selection of trees.  
  - Print the list of `sapling_id`s that would be reserved.  
  - **Do not update** the database.  

---

## Inputs  
- **plot_id** (single or multiple).  
- **reservation percentage** (default = 20%).  
- **dryRun** flag (`true/false`).  

---

## Outputs  
- In **dry-run**:  
  - JSON summary of each plot, per plant type:  
    - total trees  
    - required buffer count  
    - already reserved count  
    - additional trees reserved in this run (list of `sapling_id`s).  
- In **execute mode**:  
  - Same summary as above + DB update success confirmation.  

---

## Implementation Requirements (Node.js)  

1. **Database**  
   - PostgreSQL (`pg` npm package).  
   - Use schema: `"14trees".trees`.  

2. **Steps**  
   - Accept `plot_id(s)`, reservation percentage, and `dryRun` flag from CLI args or config.  
   - Query all plant types in the plot(s).  
   - For each plant type:  
     1. Count total trees.  
     2. Calculate buffer = ceil(20%).  
     3. Count how many are **already reserved** (per re-run rules).  
     4. If already reserved < buffer, select additional trees (eligible ones).  
     5. Either print (`dryRun`) or update (`execute`).  

3. **Tree Selection Logic**  
   - Deterministic selection to avoid randomness.  
   - Use **lowest `sapling_id` order** for consistent results.  

4. **Error Handling**  
   - If insufficient eligible trees exist, log a warning.  
   - If DB update fails, rollback transaction.  

---

## Example Dry-Run Output  

```json
{
  "plot_id": 101,
  "reservation_percentage": 20,
  "plant_types": [
    {
      "plant_type_id": 1,
      "total_trees": 50,
      "required_buffer": 10,
      "already_reserved": 6,
      "newly_reserved": 4,
      "reserved_sapling_ids": ["342614", "342615", "342616", "342617"]
    },
    {
      "plant_type_id": 2,
      "total_trees": 30,
      "required_buffer": 6,
      "already_reserved": 6,
      "newly_reserved": 0,
      "reserved_sapling_ids": []
    }
  ]
}