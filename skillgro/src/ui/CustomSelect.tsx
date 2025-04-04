/* eslint-disable @typescript-eslint/no-explicit-any */
import Select from 'react-select';
import makeAnimated from 'react-select/animated';

const animatedComponents = makeAnimated();

const options = [
   { value: 'business', label: 'Business' },
   { value: 'data-science', label: 'Data Science' },
   { value: 'art-design', label: 'Art & Design' },
   { value: 'marketing', label: 'Marketing' },
   { value: 'finance', label: 'Finance' },
];

const CustomSelect = ({ value, onChange }: any) => {
   return (
      <form onSubmit={(e) => e.preventDefault()} className="tgmenu__search-form">
        
         <div className="input-grp">
            <input type="text" placeholder="Search For Course . . ." />
            <button type="submit"><i className="flaticon-search"></i></button>
         </div>
      </form>
   );
};

export default CustomSelect;
