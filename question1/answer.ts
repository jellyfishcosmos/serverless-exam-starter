//console.log('Hello world')

interface Car {
    make: string;
    color: string;
    registration: string;
    owner: string;
  }
  
  interface Bicycle {
    make: string;
    color: string;
    owner: string;
  }
  
  type Transporter = Car | Bicycle;
  
  const database: Transporter[] = [
   {   // Car
      make: "Toyota Yaris",
      color: "Red",
      registration: "231WD1234",
      owner: "Jane Smith",
   },
   {    // Car
      make: "Suzuki Swift",
      color: "Blue",
      registration: "241WD4321",
      owner: "Paul O Regan",
   },
   {   // Car
      make: "Ford Puma",
      color: "Blue",
      registration: "241WD1212",
      owner: "Eileen Silk",
   },
   {   // Bicycle
      make: "Revel Rascal XO",
      color: "Blue",
      owner: "Cindy Tamoka",
   },
   {    // Bicycle
      make: "Yeti SB140 LR",
      color: "Red",
      owner: " ",
   },
  ];
//first fefie the  types of filter criteria 
  function getMatches(criteria: { color?: string, make?: string, hasRegistration?: boolean }): Transporter[] {
    return database.filter((transporter) => {
      let match = true;
  //check to see if the colour is what we are looking for 
      if (criteria.color && transporter.color !== criteria.color) {
        match = false;
      }
      //check to see if the make is what we are looking for 
      if (criteria.make && transporter.make !== criteria.make) {
        match = false;
      }
      //check to see if its a car(if it has a registration, it has to be a car as bikes dont have one )
      if (criteria.hasRegistration !== undefined && "registration" in transporter !== criteria.hasRegistration) {
        match = false;
      }
  
      return match;
    });
  }
  
 //testing using the questions 
  console.log(getMatches({ color: "Blue" })); //get any matching blue vehicles, should return bikes and cars
  console.log(getMatches({ color: "Red", hasRegistration: true })); //get red cars, should not rerutn the red bike 

  //output:

//   {
//     make: 'Suzuki Swift',
//     color: 'Blue',
//     registration: '241WD4321',
//     owner: 'Paul O Regan'
//   },
//   {
//     make: 'Ford Puma',
//     color: 'Blue',
//     registration: '241WD1212',
//     owner: 'Eileen Silk'
//   },
//   { make: 'Revel Rascal XO', color: 'Blue', owner: 'Cindy Tamoka' }
// ]
// [
//   {
//     make: 'Toyota Yaris',
//     color: 'Red',
//     registration: '231WD1234',
//     owner: 'Jane Smith'
//   }
// ] 